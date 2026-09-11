import { revalidateTag } from 'next/cache';

import type { Membership } from '@/lib/auth/personal-organization';
import type { AddressInput } from '@/lib/events/event-address-patch';
import type { EventPatch } from '@/lib/events/event-repository';
import type { NotificationPatch, NotificationSettings } from '@/lib/events/notification-settings';

import { db } from '@/db/client';
import { DrizzleOrganizationStore } from '@/lib/auth/drizzle-organization-store';
import { ensurePersonalOrganization } from '@/lib/auth/personal-organization';
import { resolveAddressPatch } from '@/lib/events/event-address-patch';
import { eventDetailsTag, eventGuestsTag, eventListTag } from '@/lib/events/event-cache';
import { addressSingleLine, toEventAddress } from '@/lib/events/event-location';
import { eventAccess, eventRepository } from '@/lib/events/event-services';
import { parseGuestList, toGuest } from '@/lib/events/guest-list-parser';
import { invitationUrl } from '@/lib/events/invitation-url';
import { resolveNotificationSettings } from '@/lib/events/notification-settings';
import { guestName } from '@/lib/events/response-summary';

// what an agent may do with events. the boundary is deliberate: an agent creates, maintains, and
// may drop a single invitation, but nothing here deletes or archives an event, replaces a link or
// answers on a guest's behalf — the actions that cannot be taken back or that would put words in
// someone else's mouth. links can be read, but only against their own scope.

export type McpEventResult<T> = { data: T; success: true } | { error: string; success: false };

const organizationStore = new DrizzleOrganizationStore(db);

const MESSAGES = {
	emptyName: 'Der Name darf nicht leer sein.',
	invitationNotFound: 'Diese Einladung gehört nicht zu diesem Event.',
	noNames: 'In der Liste steht kein Name.',
	notFound: 'Dieses Event gibt es nicht, oder es gehört zu einer anderen Organisation.',
	notificationsNeedEmail: 'Für Benachrichtigungen braucht es eine E-Mail-Adresse.',
} as const;

// this runs in a route handler, where updateTag throws — revalidateTag is the one that works
// there. `expire: 0` keeps the read-your-own-writes behaviour: the host's next page load waits for
// fresh data instead of being handed the copy from before the agent's change.
const IMMEDIATELY = { expire: 0 } as const;

function expire(...tags: string[]): void {
	for (const tag of tags) {
		revalidateTag(tag, IMMEDIATELY);
	}
}

function failed<T>(error: string): McpEventResult<T> {
	return { error, success: false };
}

export type McpEventSummary = {
	accepted: number;
	declined: number;
	id: string;
	invitations: number;
	open: number;
	startsAt: null | string;
	status: string;
	title: string;
	unsent: number;
};

export type McpInvitationLink = {
	guests: string[];
	id: string;
	sentAt: null | string;
	token: string;
	url: string;
};

export type McpEventViews = {
	invitations: { guests: string[]; id: string; lastViewedAt: null | string; viewCount: number }[];
	totalViews: number;
	viewedInvitations: number;
};

export class McpEventService {
	// the agent acts as the user, in the user's own organization
	private async membershipFor(userId: string): Promise<Membership> {
		return await ensurePersonalOrganization(organizationStore, { id: userId });
	}

	// the same first two steps every event method needs: the caller's organization, and the event
	// inside it. an event of another organization reads as missing, never as forbidden.
	private async manage(userId: string, eventId: string): Promise<McpEventResult<Membership>> {
		const membership = await this.membershipFor(userId);
		const access = await eventAccess.forManaging(eventId, membership);

		if (!access.success) {
			return failed(MESSAGES.notFound);
		}

		return { data: membership, success: true };
	}

	public async listEvents(
		userId: string,
		includeArchived: boolean
	): Promise<McpEventResult<{ events: McpEventSummary[] }>> {
		const membership = await this.membershipFor(userId);
		const statuses = includeArchived ? (['active', 'archived'] as const) : (['active'] as const);
		const lists = await Promise.all(
			statuses.map((status) => eventRepository.listEvents(membership.organizationId, status))
		);

		return {
			data: {
				events: lists.flat().map((item) => ({
					accepted: item.counts.accepted,
					declined: item.counts.declined,
					id: item.id,
					invitations: item.counts.invitations,
					open: item.counts.open,
					startsAt: item.startsAt?.toISOString() ?? null,
					status: item.status,
					title: item.title,
					unsent: item.counts.unsent,
				})),
			},
			success: true,
		};
	}

	public async getEvent(userId: string, eventId: string) {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const [event, invitations, fields, counts] = await Promise.all([
			eventRepository.findEvent(eventId, scope.data.organizationId),
			eventRepository.listInvitations(eventId),
			eventRepository.listFormFields(eventId),
			eventRepository.eventCounts(eventId),
		]);

		if (!event) {
			return failed<{ event: unknown }>(MESSAGES.notFound);
		}

		return {
			data: {
				event: {
					counts,
					endsAt: event.endsAt?.toISOString() ?? null,
					fields: fields.map((field) => ({
						id: field.id,
						label: field.label,
						onlyWhenAttending: field.onlyWhenAttending,
						options: field.options.map((option) => option.label),
						required: field.required,
						scope: field.scope,
						type: field.type,
					})),
					greeting: event.greeting,
					id: event.id,
					// invitations carry no token: a link is for the guest it was made for, and reading
					// one is what get_invitation_links and its own scope are for
					invitations: invitations.map((invitation) => ({
						guests: invitation.guests.map((guest) => ({
							id: guest.id,
							isMainGuest: guest.isMainGuest,
							name: guestName(guest),
							response: guest.response,
						})),
						id: invitation.id,
						sentAt: invitation.sentAt?.toISOString() ?? null,
					})),
					location: addressSingleLine(toEventAddress(event)),
					notifications: { email: event.notificationEmail, enabled: event.notifyOnResponse },
					responseDeadline: event.responseDeadline?.toISOString() ?? null,
					startsAt: event.startsAt?.toISOString() ?? null,
					status: event.status,
					title: event.title,
				},
			},
			success: true as const,
		};
	}

	public async createEvent(userId: string, title: string): Promise<McpEventResult<{ eventId: string }>> {
		const membership = await this.membershipFor(userId);
		const eventId = await eventRepository.createEvent({
			createdByUserId: userId,
			organizationId: membership.organizationId,
			title,
		});

		expire(eventListTag(membership.organizationId));

		return { data: { eventId }, success: true };
	}

	// the address arrives in parts and only the named ones change, so an agent can correct one line
	// without repeating the rest — and the map pin is re-read whenever the result is a new address
	public async updateEvent(
		userId: string,
		eventId: string,
		patch: EventPatch,
		address: Partial<AddressInput>
	): Promise<McpEventResult<{ eventId: string }>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const current = await eventRepository.findEvent(eventId, scope.data.organizationId);

		if (!current) {
			return failed(MESSAGES.notFound);
		}

		const stored = toEventAddress(current);
		const resolved = await resolveAddressPatch(
			{
				city: address.city ?? stored.city,
				name: address.name ?? stored.name,
				postalCode: address.postalCode ?? stored.postalCode,
				street: address.street ?? stored.street,
			},
			stored
		);

		await eventRepository.updateEvent(eventId, { ...patch, ...resolved });

		// the title and date show on the card too, so the list goes with it
		expire(eventDetailsTag(eventId), eventListTag(scope.data.organizationId));

		return { data: { eventId }, success: true };
	}

	// enabled and email are resolved against what is already stored, so an agent can flip the
	// switch without repeating the address, or change the address without touching the switch
	public async setNotifications(
		userId: string,
		eventId: string,
		settings: NotificationPatch
	): Promise<McpEventResult<NotificationSettings>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const current = await eventRepository.findEvent(eventId, scope.data.organizationId);

		if (!current) {
			return failed(MESSAGES.notFound);
		}

		const resolved = resolveNotificationSettings(
			{ email: current.notificationEmail, enabled: current.notifyOnResponse },
			settings
		);

		if (!resolved.valid) {
			return failed(MESSAGES.notificationsNeedEmail);
		}

		await eventRepository.updateEvent(eventId, {
			notificationEmail: resolved.settings.email,
			notifyOnResponse: resolved.settings.enabled,
		});

		expire(eventDetailsTag(eventId));

		return { data: resolved.settings, success: true };
	}

	public async addInvitations(
		userId: string,
		eventId: string,
		rawList: string
	): Promise<McpEventResult<{ created: number }>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const { invitations } = parseGuestList(rawList);

		if (invitations.length === 0) {
			return failed(MESSAGES.noNames);
		}

		const created = await eventRepository.createInvitations(
			eventId,
			invitations.map((invitation) => ({ guests: invitation.guests }))
		);

		expire(eventGuestsTag(eventId), eventListTag(scope.data.organizationId));

		return { data: { created }, success: true };
	}

	public async markInvitationSent(
		userId: string,
		eventId: string,
		invitationId: string,
		sent: boolean
	): Promise<McpEventResult<{ invitationId: string }>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		await eventRepository.markSent(eventId, invitationId, sent ? new Date() : null);

		expire(eventGuestsTag(eventId), eventListTag(scope.data.organizationId));

		return { data: { invitationId }, success: true };
	}

	// final: the guests on the invitation and their answers go with it
	public async deleteInvitation(
		userId: string,
		eventId: string,
		invitationId: string
	): Promise<McpEventResult<{ invitationId: string }>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const deleted = await eventRepository.deleteInvitation(eventId, invitationId);

		if (!deleted) {
			return failed(MESSAGES.invitationNotFound);
		}

		expire(eventGuestsTag(eventId), eventListTag(scope.data.organizationId));

		return { data: { invitationId }, success: true };
	}

	// the answers and the history stay with the same person; only the name changes
	public async renameGuest(
		userId: string,
		eventId: string,
		guestId: string,
		name: string
	): Promise<McpEventResult<{ guestId: string }>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const guest = toGuest(name);

		if (!guest) {
			return failed(MESSAGES.emptyName);
		}

		await eventRepository.updateGuest(guestId, { firstName: guest.firstName, lastName: guest.lastName });

		expire(eventGuestsTag(eventId));

		return { data: { guestId }, success: true };
	}

	public async listInvitationLinks(
		userId: string,
		eventId: string
	): Promise<McpEventResult<{ invitations: McpInvitationLink[] }>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const invitations = await eventRepository.listInvitations(eventId);

		return {
			data: {
				invitations: invitations.map((invitation) => ({
					guests: invitation.guests.map(guestName),
					id: invitation.id,
					sentAt: invitation.sentAt?.toISOString() ?? null,
					token: invitation.token,
					url: invitationUrl(invitation.token),
				})),
			},
			success: true,
		};
	}

	// the tally counts openings, not people: the same guest reopening their link raises it again
	public async eventViews(userId: string, eventId: string): Promise<McpEventResult<McpEventViews>> {
		const scope = await this.manage(userId, eventId);

		if (!scope.success) {
			return scope;
		}

		const invitations = await eventRepository.listInvitations(eventId);

		return {
			data: {
				invitations: invitations.map((invitation) => ({
					guests: invitation.guests.map(guestName),
					id: invitation.id,
					lastViewedAt: invitation.lastViewedAt?.toISOString() ?? null,
					viewCount: invitation.viewCount,
				})),
				totalViews: invitations.reduce((total, invitation) => total + invitation.viewCount, 0),
				viewedInvitations: invitations.filter((invitation) => invitation.viewCount > 0).length,
			},
			success: true,
		};
	}
}

// the public surface, structurally: EventSession takes this rather than the class, so a test can
// stand in for the service without reaching a database
export type McpEventPort = Pick<McpEventService, keyof McpEventService>;
