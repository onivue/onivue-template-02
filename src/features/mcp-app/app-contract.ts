import { z } from 'zod';

// the one description of what travels between the event tools and the app view. the view parses
// every payload against these schemas rather than trusting the shape it is handed, and the server
// reuses the same names so a field cannot be renamed on one side only.

export const MCP_APP_RESOURCE_URI = 'ui://onivue/events';

export const MCP_APP_RESOURCE_NAME = 'Events und Einladungen';

// the tools the view drives through the host. they are the same tools the model calls, registered
// once in mcp-event-tools.ts — the app gets no private door into the data.
export const MCP_APP_TOOLS = {
	addInvitations: 'add_invitations',
	deleteInvitation: 'delete_invitation',
	getEvent: 'get_event',
	getInvitationLinks: 'get_invitation_links',
	listEvents: 'list_events',
	markInvitationSent: 'mark_invitation_sent',
} as const;

export const guestResponseSchema = z.enum(['accepted', 'declined', 'open']);

export const mcpAppEventSchema = z.object({
	accepted: z.number(),
	declined: z.number(),
	id: z.string(),
	invitations: z.number(),
	open: z.number(),
	startsAt: z.string().nullable(),
	status: z.string(),
	title: z.string(),
	unsent: z.number(),
});

export const mcpAppEventListSchema = z.object({
	events: z.array(mcpAppEventSchema),
});

export const mcpAppGuestSchema = z.object({
	id: z.string(),
	isMainGuest: z.boolean(),
	name: z.string(),
	response: guestResponseSchema,
});

export const mcpAppInvitationSchema = z.object({
	guests: z.array(mcpAppGuestSchema),
	id: z.string(),
	sentAt: z.string().nullable(),
});

// get_event answers with far more than the app shows; everything unlisted is dropped here rather
// than carried through the view
export const mcpAppEventDetailSchema = z.object({
	event: z.object({
		id: z.string(),
		invitations: z.array(mcpAppInvitationSchema),
		location: z.string().nullable(),
		startsAt: z.string().nullable(),
		title: z.string(),
	}),
});

export const mcpAppDeletedInvitationSchema = z.object({
	invitationId: z.string(),
});

export const mcpAppAddInvitationsResultSchema = z.object({
	created: z.number(),
});

export const mcpAppMarkInvitationSentResultSchema = z.object({
	invitationId: z.string(),
});

// get_invitation_links answers with the guests and sentAt of every invitation too; the row only
// ever needs the url of the one it is copying
export const mcpAppInvitationLinkSchema = z.object({
	id: z.string(),
	url: z.string(),
});

export const mcpAppInvitationLinksSchema = z.object({
	invitations: z.array(mcpAppInvitationLinkSchema),
});

export type TGuestResponse = z.infer<typeof guestResponseSchema>;
export type TMcpAppEvent = z.infer<typeof mcpAppEventSchema>;
export type TMcpAppEventDetail = z.infer<typeof mcpAppEventDetailSchema>['event'];
export type TMcpAppGuest = z.infer<typeof mcpAppGuestSchema>;
export type TMcpAppInvitation = z.infer<typeof mcpAppInvitationSchema>;
export type TMcpAppInvitationLink = z.infer<typeof mcpAppInvitationLinkSchema>;
