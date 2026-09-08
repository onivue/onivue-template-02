import { revalidateTag } from 'next/cache';

import type { Membership } from '@/lib/auth/personal-organization';
import type { EventPatch } from '@/lib/events/event-repository';

import { db } from '@/db/client';
import { DrizzleOrganizationStore } from '@/lib/auth/drizzle-organization-store';
import { ensurePersonalOrganization } from '@/lib/auth/personal-organization';
import { eventInvitationsTag, eventListTag, eventTag } from '@/lib/events/event-cache';
import { eventAccess, eventRepository } from '@/lib/events/event-services';
import { parseGuestList } from '@/lib/events/guest-list-parser';

// what an agent may do with events. the boundary is deliberate: an agent creates and maintains,
// but nothing here deletes, archives, replaces a token or answers on a guest's behalf — the four
// actions that cannot be taken back or that would put words in someone else's mouth.

export type McpEventResult<T> = { data: T; success: true } | { error: string; success: false };

const organizationStore = new DrizzleOrganizationStore(db);

const MESSAGES = {
	notFound: 'Dieses Event gibt es nicht, oder es gehört zu einer anderen Organisation.',
	noNames: 'In der Liste steht kein Name.',
} as const;

function failed<T>(error: string): McpEventResult<T> {
	return { error, success: false };
}

// updateTag is server-actions only, and an agent writes from a route handler
function expire(...tags: string[]): void {
	for (const tag of tags) {
		revalidateTag(tag, 'max');
	}
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

export class McpEventService {
	// the agent acts as the user, in the user's own organization
	private async membershipFor(userId: string): Promise<Membership> {
		return await ensurePersonalOrganization(organizationStore, { id: userId });
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
		const membership = await this.membershipFor(userId);
		const access = await eventAccess.forManaging(eventId, membership);

		if (!access.success) {
			return failed<{ event: unknown }>(MESSAGES.notFound);
		}

		const [event, invitations, fields, counts] = await Promise.all([
			eventRepository.findEvent(eventId, membership.organizationId),
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
					// invitations carry no token: a link is for the guest it was made for
					invitations: invitations.map((invitation) => ({
						guests: invitation.guests.map((guest) => ({
							id: guest.id,
							isMainGuest: guest.isMainGuest,
							name: [guest.firstName, guest.lastName].filter(Boolean).join(' '),
							response: guest.response,
						})),
						id: invitation.id,
						sentAt: invitation.sentAt?.toISOString() ?? null,
					})),
					location: event.location,
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

	public async updateEvent(
		userId: string,
		eventId: string,
		patch: EventPatch
	): Promise<McpEventResult<{ eventId: string }>> {
		const membership = await this.membershipFor(userId);
		const access = await eventAccess.forManaging(eventId, membership);

		if (!access.success) {
			return failed(MESSAGES.notFound);
		}

		await eventRepository.updateEvent(eventId, patch);

		expire(eventTag(eventId), eventListTag(membership.organizationId));

		return { data: { eventId }, success: true };
	}

	public async addInvitations(
		userId: string,
		eventId: string,
		rawList: string
	): Promise<McpEventResult<{ created: number }>> {
		const membership = await this.membershipFor(userId);
		const access = await eventAccess.forManaging(eventId, membership);

		if (!access.success) {
			return failed(MESSAGES.notFound);
		}

		const { invitations } = parseGuestList(rawList);

		if (invitations.length === 0) {
			return failed(MESSAGES.noNames);
		}

		const created = await eventRepository.createInvitations(
			eventId,
			invitations.map((invitation) => ({ guests: invitation.guests }))
		);

		expire(eventInvitationsTag(eventId), eventListTag(membership.organizationId));

		return { data: { created }, success: true };
	}

	public async markInvitationSent(
		userId: string,
		eventId: string,
		invitationId: string,
		sent: boolean
	): Promise<McpEventResult<{ invitationId: string }>> {
		const membership = await this.membershipFor(userId);
		const access = await eventAccess.forManaging(eventId, membership);

		if (!access.success) {
			return failed(MESSAGES.notFound);
		}

		await eventRepository.markSent(invitationId, sent ? new Date() : null);

		expire(eventInvitationsTag(eventId), eventListTag(membership.organizationId));

		return { data: { invitationId }, success: true };
	}
}
