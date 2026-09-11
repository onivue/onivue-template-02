import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';

import { z } from 'zod';

import type { EventSession } from '@/lib/mcp/event-session';
import type { McpEventResult } from '@/lib/mcp/mcp-event-service';

import { parseBerlinDateTime } from '@/lib/events/berlin-time';
import { MCP_CONFIG } from '@/lib/mcp/mcp-config';
import { toolError, toolSuccess } from '@/lib/mcp/mcp-result';

const eventIdSchema = z.string().min(1).describe('Die id des Events.');

const invitationIdSchema = z.string().min(1).describe('Die id der Einladung.');

const notificationEmailSchema = z
	.string()
	.trim()
	.max(200)
	.refine((value) => value === '' || z.email().safeParse(value).success, 'Das ist keine gültige E-Mail-Adresse.')
	.describe('Empfängeradresse. Leerer String löscht sie und schaltet damit auch ab.');

const dateSchema = z
	.string()
	.describe(
		'Zeitpunkt in deutscher Zeit, als "2026-07-15T18:00", oder ein Tag ohne Uhrzeit als "2026-07-15". Leerer String löscht die Angabe.'
	);

function toResult<T extends Record<string, unknown>>(result: McpEventResult<T>): CallToolResult {
	return result.success ? toolSuccess(result.data) : toolError(result.error);
}

// events for one authenticated request. the caller's identity and granted scopes are already
// inside the session, so the handlers are pure MCP glue. the write tools stop short of the rest of
// what is irreversible: deleting or archiving an event, replacing a token and answering for a
// guest are not offered at all, so an agent cannot reach them even with the write scope.
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
				'Liest ein Event mit Einladungen, Personen, Antwortstand, Benachrichtigungs-Einstellungen und Formularfeldern. Einladungslinks sind bewusst nicht enthalten — dafür gibt es get_invitation_links.',
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
			description:
				'Ändert Titel, Zeiten, Adresse, Begrüßungstext oder Antwort-Frist eines Events. Aus der Adresse entstehen Karte und Kartenlinks automatisch.',
			inputSchema: {
				endsAt: dateSchema.optional(),
				eventId: eventIdSchema,
				greeting: z.string().max(2000).optional(),
				locationCity: z.string().max(120).optional().describe('Ortschaft, z. B. "Gossau".'),
				locationName: z.string().max(200).optional().describe('Name des Lokals, z. B. "Gasthaus Krone".'),
				locationPostalCode: z.string().max(20).optional().describe('PLZ, z. B. "9200".'),
				locationStreet: z.string().max(200).optional().describe('Strasse und Nummer.'),
				responseDeadline: dateSchema.optional(),
				startsAt: dateSchema.optional(),
				title: z.string().min(1).max(120).optional(),
			},
			title: 'Event ändern',
		},
		async ({
			endsAt,
			eventId,
			greeting,
			locationCity,
			locationName,
			locationPostalCode,
			locationStreet,
			responseDeadline,
			startsAt,
			title,
		}) =>
			toResult(
				await session.updateEvent(
					eventId,
					{
						...(endsAt === undefined ? {} : { endsAt: parseBerlinDateTime(endsAt) }),
						...(greeting === undefined ? {} : { greeting: greeting || null }),
						...(responseDeadline === undefined
							? {}
							: { responseDeadline: parseBerlinDateTime(responseDeadline, 'end-of-day') }),
						...(startsAt === undefined ? {} : { startsAt: parseBerlinDateTime(startsAt) }),
						...(title === undefined ? {} : { title }),
					},
					// the address is resolved against what is stored, so an agent can correct the street
					// without repeating the town — and the map pin follows either way
					{
						...(locationCity === undefined ? {} : { city: locationCity || null }),
						...(locationName === undefined ? {} : { name: locationName || null }),
						...(locationPostalCode === undefined ? {} : { postalCode: locationPostalCode || null }),
						...(locationStreet === undefined ? {} : { street: locationStreet || null }),
					}
				)
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
				invitationId: invitationIdSchema,
				sent: z.boolean().describe('true = versendet, false = wieder als offen markieren.'),
			},
			title: 'Versand vermerken',
		},
		async ({ eventId, invitationId, sent }) =>
			toResult(await session.markInvitationSent(eventId, invitationId, sent))
	);

	server.registerTool(
		MCP_CONFIG.tools.deleteInvitation,
		{
			annotations: { destructiveHint: true },
			description:
				'Löscht eine Einladung endgültig, mit allen Personen darauf und deren Antworten. Der Link dieser Einladung funktioniert danach nicht mehr.',
			inputSchema: { eventId: eventIdSchema, invitationId: invitationIdSchema },
			title: 'Einladung löschen',
		},
		async ({ eventId, invitationId }) => toResult(await session.deleteInvitation(eventId, invitationId))
	);

	server.registerTool(
		MCP_CONFIG.tools.setNotifications,
		{
			annotations: { idempotentHint: true },
			description:
				'Schaltet die E-Mail-Benachrichtigung bei neuen Antworten ein oder aus und legt die Empfängeradresse fest. Nur angegebene Felder ändern sich; eingeschaltet ohne Adresse geht nicht.',
			inputSchema: {
				email: notificationEmailSchema.optional(),
				enabled: z.boolean().optional().describe('true = bei jeder Antwort benachrichtigen.'),
				eventId: eventIdSchema,
			},
			title: 'Benachrichtigungen einstellen',
		},
		async ({ email, enabled, eventId }) => toResult(await session.setNotifications(eventId, { email, enabled }))
	);

	server.registerTool(
		MCP_CONFIG.tools.getInvitationLinks,
		{
			annotations: { readOnlyHint: true },
			description:
				'Liest die Einladungslinks eines Events, je Einladung einen. Achtung: wer einen Link hat, kann damit für die Gäste dieser Einladung antworten — nur an die Eingeladenen weitergeben.',
			inputSchema: { eventId: eventIdSchema },
			title: 'Einladungslinks lesen',
		},
		async ({ eventId }) => toResult(await session.listInvitationLinks(eventId))
	);

	server.registerTool(
		MCP_CONFIG.tools.getEventViews,
		{
			annotations: { readOnlyHint: true },
			description:
				'Liest, wie oft die Einladungen eines Events geöffnet wurden: Summe, Anzahl der schon geöffneten Einladungen und die Zahl je Einladung. Gezählt werden Aufrufe, nicht Personen.',
			inputSchema: { eventId: eventIdSchema },
			title: 'Aufrufe lesen',
		},
		async ({ eventId }) => toResult(await session.eventViews(eventId))
	);
}
