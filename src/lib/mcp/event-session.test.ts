import { describe, expect, test } from 'bun:test';

import type { McpEventPort } from '@/lib/mcp/mcp-event-service';

import { EventSession } from '@/lib/mcp/event-session';
import { MCP_SCOPE_IDS } from '@/lib/mcp/mcp-scopes';

const EVENT_ID = 'event-1';
const INVITATION_ID = 'invitation-1';

function createPort() {
	const calls: string[] = [];
	const record = <T>(name: string, data: T) => {
		calls.push(name);

		return { data, success: true as const };
	};

	const port: McpEventPort = {
		addInvitations: async () => record('addInvitations', { created: 1 }),
		createEvent: async () => record('createEvent', { eventId: EVENT_ID }),
		deleteInvitation: async () => record('deleteInvitation', { invitationId: INVITATION_ID }),
		eventViews: async () => record('eventViews', { invitations: [], totalViews: 0, viewedInvitations: 0 }),
		getEvent: async () => record('getEvent', { event: null }),
		listEvents: async () => record('listEvents', { events: [] }),
		listInvitationLinks: async () => record('listInvitationLinks', { invitations: [] }),
		markInvitationSent: async () => record('markInvitationSent', { invitationId: INVITATION_ID }),
		setNotifications: async () => record('setNotifications', { email: null, enabled: false }),
		updateEvent: async () => record('updateEvent', { eventId: EVENT_ID }),
	};

	return { calls, port };
}

function createSession(scope: string) {
	const { calls, port } = createPort();
	const session = EventSession.fromClaims(port, { scope, sub: 'user-1' });

	if (!session) {
		throw new Error('expected a session for these claims');
	}

	return { calls, session };
}

describe('a session only exists for a verified subject', () => {
	test('claims without a sub produce no session', () => {
		const { port } = createPort();

		expect(EventSession.fromClaims(port, { scope: MCP_SCOPE_IDS.eventsRead })).toBeNull();
	});
});

describe('reading needs events:read', () => {
	test('the read tools pass with the scope', async () => {
		const { calls, session } = createSession(MCP_SCOPE_IDS.eventsRead);

		await session.listEvents(false);
		await session.getEvent(EVENT_ID);
		await session.eventViews(EVENT_ID);

		expect(calls).toEqual(['listEvents', 'getEvent', 'eventViews']);
	});

	test('without it the service is never reached', async () => {
		const { calls, session } = createSession(MCP_SCOPE_IDS.eventsWrite);
		const result = await session.eventViews(EVENT_ID);

		expect(result).toEqual({
			error: `Diesem Client fehlt der Scope "${MCP_SCOPE_IDS.eventsRead}".`,
			success: false,
		});
		expect(calls).toEqual([]);
	});
});

describe('writing needs events:write', () => {
	test('the write tools pass with the scope', async () => {
		const { calls, session } = createSession(MCP_SCOPE_IDS.eventsWrite);

		await session.createEvent('Sommerfest');
		await session.updateEvent(EVENT_ID, { title: 'Sommerfest' }, {});
		await session.setNotifications(EVENT_ID, { enabled: false });
		await session.addInvitations(EVENT_ID, 'Anna Meier');
		await session.markInvitationSent(EVENT_ID, INVITATION_ID, true);
		await session.deleteInvitation(EVENT_ID, INVITATION_ID);

		expect(calls).toEqual([
			'createEvent',
			'updateEvent',
			'setNotifications',
			'addInvitations',
			'markInvitationSent',
			'deleteInvitation',
		]);
	});

	test('a read-only client cannot delete an invitation', async () => {
		const { calls, session } = createSession(MCP_SCOPE_IDS.eventsRead);
		const result = await session.deleteInvitation(EVENT_ID, INVITATION_ID);

		expect(result).toEqual({
			error: `Diesem Client fehlt der Scope "${MCP_SCOPE_IDS.eventsWrite}".`,
			success: false,
		});
		expect(calls).toEqual([]);
	});

	test('a read-only client cannot change the notification settings', async () => {
		const { calls, session } = createSession(MCP_SCOPE_IDS.eventsRead);

		await session.setNotifications(EVENT_ID, { email: 'host@example.com', enabled: true });

		expect(calls).toEqual([]);
	});
});

describe('links have a scope of their own', () => {
	test('events:read alone does not hand out links', async () => {
		const { calls, session } = createSession(`${MCP_SCOPE_IDS.eventsRead} ${MCP_SCOPE_IDS.eventsWrite}`);
		const result = await session.listInvitationLinks(EVENT_ID);

		expect(result).toEqual({
			error: `Diesem Client fehlt der Scope "${MCP_SCOPE_IDS.eventsLinks}".`,
			success: false,
		});
		expect(calls).toEqual([]);
	});

	test('events:links does', async () => {
		const { calls, session } = createSession(MCP_SCOPE_IDS.eventsLinks);

		await session.listInvitationLinks(EVENT_ID);

		expect(calls).toEqual(['listInvitationLinks']);
	});
});
