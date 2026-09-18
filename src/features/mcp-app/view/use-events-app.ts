import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { useState } from 'react';

import type { TMcpAppEvent, TMcpAppEventDetail } from '@/features/mcp-app/app-contract';

import {
	MCP_APP_TOOLS,
	mcpAppAddInvitationsResultSchema,
	mcpAppDeletedInvitationSchema,
	mcpAppEventDetailSchema,
	mcpAppEventListSchema,
	mcpAppInvitationLinksSchema,
	mcpAppMarkInvitationSentResultSchema,
} from '@/features/mcp-app/app-contract';
import { callTool, readToolResult } from '@/features/mcp-app/view/tool-call';

// the view's whole state. every branch is named rather than assembled from optional flags, so a
// screen can never be "loading and failed" at once.

export type TEventsState =
	| { events: TMcpAppEvent[]; kind: 'ready' }
	| { kind: 'failed'; message: string }
	| { kind: 'loading' };

export type TSelectionState =
	| { event: TMcpAppEventDetail; kind: 'ready' }
	| { eventId: string; kind: 'failed'; message: string }
	| { eventId: string; kind: 'loading' }
	| { kind: 'none' };

export type TAddInvitationsOutcome = { created: number } | { error: string };

const APP_INFO = { name: 'onivue-events', version: '1.0.0' };

const MESSAGES = {
	cancelled: 'Der Aufruf wurde abgebrochen.',
	clipboardFailed: 'Der Link konnte nicht kopiert werden.',
	linkNotFound: 'Für diese Einladung wurde kein Link gefunden.',
} as const;

// what the model is told about the app while the person clicks around in it, so the next turn of
// the conversation knows which event is open and what just happened to it
function describeSelection(selection: TSelectionState): string {
	if (selection.kind !== 'ready') {
		return 'In der Event-App ist gerade kein Event geöffnet.';
	}

	return [
		`In der Event-App ist "${selection.event.title}" geöffnet (id ${selection.event.id})`,
		`mit ${selection.event.invitations.length} Einladungen.`,
	].join(' ');
}

export function useEventsApp() {
	const [events, setEvents] = useState<TEventsState>({ kind: 'loading' });
	const [selection, setSelection] = useState<TSelectionState>({ kind: 'none' });

	const { app, error } = useApp({
		appInfo: APP_INFO,
		capabilities: { availableDisplayModes: ['inline', 'fullscreen'] },
		onAppCreated: (created) => {
			created.ontoolresult = (result) => {
				const outcome = readToolResult(result, mcpAppEventListSchema);

				setEvents(
					outcome.success
						? { events: outcome.data.events, kind: 'ready' }
						: { kind: 'failed', message: outcome.message }
				);
			};

			created.ontoolcancelled = ({ reason }) => {
				setEvents({ kind: 'failed', message: reason || MESSAGES.cancelled });
			};
		},
	});

	// theme, host css variables and host fonts, re-applied whenever the host context changes
	useHostStyles(app, app?.getHostContext());

	// telling the model what is on screen is a courtesy, not part of the click: a host that declines
	// the update, or does not offer it at all, must not break the navigation that triggered it
	const reportSelection = async (next: TSelectionState) => {
		try {
			await app?.updateModelContext({ content: [{ text: describeSelection(next), type: 'text' }] });
		} catch {
			// the host said no; the view carries on
		}
	};

	const reloadEvents = async () => {
		setEvents({ kind: 'loading' });

		const outcome = await callTool(app, MCP_APP_TOOLS.listEvents, {}, mcpAppEventListSchema);

		setEvents(
			outcome.success
				? { events: outcome.data.events, kind: 'ready' }
				: { kind: 'failed', message: outcome.message }
		);
	};

	const openEvent = async (eventId: string) => {
		setSelection({ eventId, kind: 'loading' });

		const outcome = await callTool(app, MCP_APP_TOOLS.getEvent, { eventId }, mcpAppEventDetailSchema);
		const next: TSelectionState = outcome.success
			? { event: outcome.data.event, kind: 'ready' }
			: { eventId, kind: 'failed', message: outcome.message };

		setSelection(next);
		await reportSelection(next);
	};

	const closeEvent = async () => {
		setSelection({ kind: 'none' });
		await reportSelection({ kind: 'none' });
	};

	// the host runs the deletion as a tool call, so the app never writes to the database itself. the
	// event is read back afterwards rather than patched locally, so the counters cannot drift.
	const deleteInvitation = async (eventId: string, invitationId: string): Promise<null | string> => {
		const outcome = await callTool(
			app,
			MCP_APP_TOOLS.deleteInvitation,
			{ eventId, invitationId },
			mcpAppDeletedInvitationSchema
		);

		if (!outcome.success) {
			return outcome.message;
		}

		await openEvent(eventId);
		await reloadEvents();

		return null;
	};

	// created the same way a host would call the tool itself — read back afterwards, same as
	// deletion, so the counters on both screens agree with what the server actually stored
	const addInvitations = async (eventId: string, guestList: string): Promise<TAddInvitationsOutcome> => {
		const outcome = await callTool(
			app,
			MCP_APP_TOOLS.addInvitations,
			{ eventId, guestList },
			mcpAppAddInvitationsResultSchema
		);

		if (!outcome.success) {
			return { error: outcome.message };
		}

		await openEvent(eventId);
		await reloadEvents();

		return { created: outcome.data.created };
	};

	const setInvitationSent = async (eventId: string, invitationId: string, sent: boolean): Promise<null | string> => {
		const outcome = await callTool(
			app,
			MCP_APP_TOOLS.markInvitationSent,
			{ eventId, invitationId, sent },
			mcpAppMarkInvitationSentResultSchema
		);

		if (!outcome.success) {
			return outcome.message;
		}

		await openEvent(eventId);
		await reloadEvents();

		return null;
	};

	// its own scope on the server (events:links), because a link is the whole authorization for the
	// guests on it — a client without that scope gets the missing-scope message here, not a crash
	const copyInvitationLink = async (eventId: string, invitationId: string): Promise<null | string> => {
		const outcome = await callTool(app, MCP_APP_TOOLS.getInvitationLinks, { eventId }, mcpAppInvitationLinksSchema);

		if (!outcome.success) {
			return outcome.message;
		}

		const link = outcome.data.invitations.find((invitation) => invitation.id === invitationId);

		if (!link) {
			return MESSAGES.linkNotFound;
		}

		if (!navigator.clipboard?.writeText) {
			return MESSAGES.clipboardFailed;
		}

		try {
			await navigator.clipboard.writeText(link.url);
		} catch {
			return MESSAGES.clipboardFailed;
		}

		return null;
	};

	return {
		addInvitations,
		closeEvent,
		connectionError: error,
		copyInvitationLink,
		deleteInvitation,
		events,
		openEvent,
		reloadEvents,
		selection,
		setInvitationSent,
	};
}
