import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';

import { z } from 'zod';

import type { EventSession } from '@/lib/mcp/event-session';
import type { McpEventResult } from '@/lib/mcp/mcp-event-service';

import { parseBerlinDateTime } from '@/lib/events/berlin-time';
import { MCP_CONFIG } from '@/lib/mcp/mcp-config';
import { toolError, toolSuccess } from '@/lib/mcp/mcp-result';

const eventIdSchema = z.string().min(1).describe('Die id des Events.');

const dateSchema = z
	.string()
	.describe(
		'Zeitpunkt in deutscher Zeit, als "2026-07-15T18:00", oder ein Tag ohne Uhrzeit als "2026-07-15". Leerer String löscht die Angabe.'
	);

function toResult<T extends Record<string, unknown>>(result: McpEventResult<T>): CallToolResult {
	return result.success ? toolSuccess(result.data) : toolError(result.error);
}

// events for one authenticated request. the caller's identity and granted scopes are already
// inside the session, so the handlers are pure MCP glue. the write tools stop short of anything
// irreversible: deleting, archiving, replacing a token and answering for a guest are not offered
// at all, so an agent cannot reach them even with the write scope.
export function registerEventTools(server: McpServer, session: EventSession): void {
	server.registerTool(
		MCP_CONFIG.tools.listEvents,
		{
			annotations: { readOnlyHint: true },
			description: 'Listet die Events des Nutzers mit Zu-, Ab- und offenen Antworten.',
			inputSchema: { includeArchived: z.boolean().optional().describe('Auch archivierte Events einschließen.') },
			title: 'Events auflisten',
		},
		async ({ includeArchived }) => toResult(await session.listEvents(includeArchived ?? false))
	);

	server.registerTool(
		MCP_CONFIG.tools.getEvent,
		{
			annotations: { readOnlyHint: true },
			description:
				'Liest ein Event mit Einladungen, Personen, Antwortstand und Formularfeldern. Einladungslinks sind bewusst nicht enthalten.',
			inputSchema: { eventId: eventIdSchema },
			title: 'Event lesen',
		},
		async ({ eventId }) => toResult(await session.getEvent(eventId))
	);

	server.registerTool(
		MCP_CONFIG.tools.createEvent,
		{
			description: 'Legt ein neues Event an. Alles Weitere wird danach mit update_event gepflegt.',
			inputSchema: { title: z.string().min(1).max(120).describe('Titel des Events.') },
			title: 'Event anlegen',
		},
		async ({ title }) => toResult(await session.createEvent(title))
	);

	server.registerTool(
		MCP_CONFIG.tools.updateEvent,
		{
			annotations: { idempotentHint: true },
			description: 'Ändert Titel, Zeiten, Ort, Begrüßungstext oder Antwort-Frist eines Events.',
			inputSchema: {
				endsAt: dateSchema.optional(),
				eventId: eventIdSchema,
				greeting: z.string().max(2000).optional(),
				location: z.string().max(200).optional(),
				responseDeadline: dateSchema.optional(),
				startsAt: dateSchema.optional(),
				title: z.string().min(1).max(120).optional(),
			},
			title: 'Event ändern',
		},
		async ({ endsAt, eventId, greeting, location, responseDeadline, startsAt, title }) =>
			toResult(
				await session.updateEvent(eventId, {
					...(endsAt === undefined ? {} : { endsAt: parseBerlinDateTime(endsAt) }),
					...(greeting === undefined ? {} : { greeting: greeting || null }),
					...(location === undefined ? {} : { location: location || null }),
					...(responseDeadline === undefined
						? {}
						: { responseDeadline: parseBerlinDateTime(responseDeadline, 'end-of-day') }),
					...(startsAt === undefined ? {} : { startsAt: parseBerlinDateTime(startsAt) }),
					...(title === undefined ? {} : { title }),
				})
			)
	);

	server.registerTool(
		MCP_CONFIG.tools.addInvitations,
		{
			description:
				'Legt Einladungen an. Eine Zeile ist eine Einladung, Personen mit Komma trennen — die erste Person ist die Hauptperson.',
			inputSchema: {
				eventId: eventIdSchema,
				guestList: z.string().min(1).describe('z. B. "Anna Meier, Ben Meier\\nOma"'),
			},
			title: 'Einladungen anlegen',
		},
		async ({ eventId, guestList }) => toResult(await session.addInvitations(eventId, guestList))
	);

	server.registerTool(
		MCP_CONFIG.tools.markInvitationSent,
		{
			annotations: { idempotentHint: true },
			description:
				'Vermerkt, ob eine Einladung bereits verschickt wurde. Die App verschickt selbst nichts — das ist reine Buchführung.',
			inputSchema: {
				eventId: eventIdSchema,
				invitationId: z.string().min(1),
				sent: z.boolean().describe('true = versendet, false = wieder als offen markieren.'),
			},
			title: 'Versand vermerken',
		},
		async ({ eventId, invitationId, sent }) =>
			toResult(await session.markInvitationSent(eventId, invitationId, sent))
	);
}
