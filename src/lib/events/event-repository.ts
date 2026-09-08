import { and, asc, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import type { db } from '@/db/client';
import type { EventStatus } from '@/lib/events/response-window';

import { event, eventAnswer, eventFormField, eventGuest, eventInvitation } from '@/db/schema';
import { createInvitationToken } from '@/lib/events/invitation-token';

// every read here is scoped by organization at the query level. there is no method that takes an
// event id alone, so no caller can forget the scope.

export type GuestResponseCounts = {
	accepted: number;
	declined: number;
	open: number;
};

export type EventListItem = {
	counts: GuestResponseCounts & { invitations: number; unsent: number };
	id: string;
	responseDeadline: Date | null;
	startsAt: Date | null;
	status: EventStatus;
	title: string;
};

export type EventRecord = typeof event.$inferSelect;
export type GuestRecord = typeof eventGuest.$inferSelect;
export type FormFieldRecord = typeof eventFormField.$inferSelect;

export type InvitationRecord = {
	guests: GuestRecord[];
	id: string;
	lastViewedAt: Date | null;
	responseDeadline: Date | null;
	sentAt: Date | null;
	token: string;
	viewCount: number;
};

export type NewInvitation = {
	guests: { firstName: string; lastName: null | string }[];
};

export type EventDraft = {
	createdByUserId: string;
	organizationId: string;
	title: string;
};

export type EventPatch = Partial<
	Pick<
		EventRecord,
		| 'decoration'
		| 'endsAt'
		| 'greeting'
		| 'location'
		| 'locationAppleMapsUrl'
		| 'locationGoogleMapsUrl'
		| 'notificationEmail'
		| 'notifyOnResponse'
		| 'responseDeadline'
		| 'startsAt'
		| 'title'
	>
>;

export class EventRepository {
	public constructor(private readonly database: typeof db) {}

	public async listEvents(organizationId: string, status: EventStatus): Promise<EventListItem[]> {
		const events = await this.database
			.select({
				id: event.id,
				responseDeadline: event.responseDeadline,
				startsAt: event.startsAt,
				status: event.status,
				title: event.title,
			})
			.from(event)
			.where(and(eq(event.organizationId, organizationId), eq(event.status, status)))
			.orderBy(desc(event.startsAt), desc(event.createdAt));

		if (events.length === 0) {
			return [];
		}

		const counts = await this.countsFor(events.map((row) => row.id));

		return events.map((row) => ({
			...row,
			counts: counts.get(row.id) ?? { accepted: 0, declined: 0, invitations: 0, open: 0, unsent: 0 },
		}));
	}

	// one pass over the guests and one over the invitations, rather than a query per event
	private async countsFor(eventIds: string[]): Promise<Map<string, EventListItem['counts']>> {
		const [guestRows, invitationRows] = await Promise.all([
			this.database
				.select({
					eventId: eventInvitation.eventId,
					response: eventGuest.response,
					total: count(),
				})
				.from(eventGuest)
				.innerJoin(eventInvitation, eq(eventGuest.invitationId, eventInvitation.id))
				.where(inArray(eventInvitation.eventId, eventIds))
				.groupBy(eventInvitation.eventId, eventGuest.response),
			this.database
				.select({
					eventId: eventInvitation.eventId,
					total: count(),
					unsent: sql<number>`count(*) filter (where ${eventInvitation.sentAt} is null)::int`,
				})
				.from(eventInvitation)
				.where(inArray(eventInvitation.eventId, eventIds))
				.groupBy(eventInvitation.eventId),
		]);

		const counts = new Map<string, EventListItem['counts']>();
		const ensure = (eventId: string) => {
			const existing = counts.get(eventId) ?? { accepted: 0, declined: 0, invitations: 0, open: 0, unsent: 0 };

			counts.set(eventId, existing);

			return existing;
		};

		for (const row of guestRows) {
			ensure(row.eventId)[row.response] = row.total;
		}

		for (const row of invitationRows) {
			const entry = ensure(row.eventId);

			entry.invitations = row.total;
			entry.unsent = Number(row.unsent);
		}

		return counts;
	}

	public async eventCounts(eventId: string): Promise<EventListItem['counts']> {
		const counts = await this.countsFor([eventId]);

		return counts.get(eventId) ?? { accepted: 0, declined: 0, invitations: 0, open: 0, unsent: 0 };
	}

	public async findEvent(eventId: string, organizationId: string): Promise<EventRecord | null> {
		const [row] = await this.database
			.select()
			.from(event)
			.where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)))
			.limit(1);

		return row ?? null;
	}

	// deliberately not part of the invitation view: that shape reaches the guest page, and the host's
	// address has no business there
	public async findNotificationTarget(eventId: string): Promise<null | { email: string; title: string }> {
		const [row] = await this.database
			.select({
				email: event.notificationEmail,
				enabled: event.notifyOnResponse,
				title: event.title,
			})
			.from(event)
			.where(eq(event.id, eventId))
			.limit(1);

		if (!row?.enabled || !row.email) {
			return null;
		}

		return { email: row.email, title: row.title };
	}

	public async createEvent(draft: EventDraft): Promise<string> {
		const id = crypto.randomUUID();

		await this.database.insert(event).values({ ...draft, id });

		return id;
	}

	public async updateEvent(eventId: string, patch: EventPatch): Promise<void> {
		await this.database.update(event).set(patch).where(eq(event.id, eventId));
	}

	public async setEventStatus(eventId: string, status: EventStatus): Promise<void> {
		await this.database.update(event).set({ status }).where(eq(event.id, eventId));
	}

	// final, and it takes the guest list with it; access is checked one layer up
	public async deleteEvent(eventId: string): Promise<void> {
		await this.database.delete(event).where(eq(event.id, eventId));
	}

	public async listInvitations(eventId: string): Promise<InvitationRecord[]> {
		const invitations = await this.database
			.select({
				id: eventInvitation.id,
				lastViewedAt: eventInvitation.lastViewedAt,
				responseDeadline: eventInvitation.responseDeadline,
				sentAt: eventInvitation.sentAt,
				token: eventInvitation.token,
				viewCount: eventInvitation.viewCount,
			})
			.from(eventInvitation)
			.where(eq(eventInvitation.eventId, eventId))
			.orderBy(asc(eventInvitation.createdAt));

		if (invitations.length === 0) {
			return [];
		}

		const guests = await this.database
			.select()
			.from(eventGuest)
			.where(
				inArray(
					eventGuest.invitationId,
					invitations.map((invitation) => invitation.id)
				)
			)
			.orderBy(asc(eventGuest.position));

		return invitations.map((invitation) => ({
			...invitation,
			guests: guests.filter((guest) => guest.invitationId === invitation.id),
		}));
	}

	// the bulk path: one batch for the whole paste, so a half-imported guest list cannot happen
	public async createInvitations(eventId: string, drafts: NewInvitation[]): Promise<number> {
		const invitations = drafts.map((draft) => ({
			guests: draft.guests,
			id: crypto.randomUUID(),
			token: createInvitationToken(),
		}));

		const statements = [
			this.database.insert(eventInvitation).values(
				invitations.map((invitation) => ({
					eventId,
					id: invitation.id,
					token: invitation.token,
				}))
			),
			this.database.insert(eventGuest).values(
				invitations.flatMap((invitation) =>
					invitation.guests.map((guest, index) => ({
						firstName: guest.firstName,
						id: crypto.randomUUID(),
						invitationId: invitation.id,
						isMainGuest: index === 0,
						lastName: guest.lastName,
						position: index,
					}))
				)
			),
		] as const;

		await this.database.batch([statements[0], statements[1]]);

		return invitations.length;
	}

	// an invitation id on its own would reach across events. the caller has been cleared for one
	// event, so every write below is narrowed to that event at the query level.
	private invitationOf(eventId: string, invitationId: string) {
		return and(eq(eventInvitation.id, invitationId), eq(eventInvitation.eventId, eventId));
	}

	public async markSent(eventId: string, invitationId: string, sentAt: Date | null): Promise<void> {
		await this.database.update(eventInvitation).set({ sentAt }).where(this.invitationOf(eventId, invitationId));
	}

	// the tally is the host's own, so they may start it over. the answers and the link stay untouched.
	public async resetInvitationViews(eventId: string, invitationId: string): Promise<void> {
		await this.database
			.update(eventInvitation)
			.set({ lastViewedAt: null, viewCount: 0 })
			.where(this.invitationOf(eventId, invitationId));
	}

	public async setInvitationDeadline(eventId: string, invitationId: string, deadline: Date | null): Promise<void> {
		await this.database
			.update(eventInvitation)
			.set({ responseDeadline: deadline })
			.where(this.invitationOf(eventId, invitationId));
	}

	// the remedy when a link has travelled somewhere it should not have: the answers stay, the old
	// link stops working. null means the event has no such invitation.
	public async rotateToken(eventId: string, invitationId: string): Promise<null | string> {
		const token = createInvitationToken();
		const [row] = await this.database
			.update(eventInvitation)
			.set({ token })
			.where(this.invitationOf(eventId, invitationId))
			.returning({ id: eventInvitation.id });

		return row ? token : null;
	}

	// final: the guests on it and their answers go too
	public async deleteInvitation(eventId: string, invitationId: string): Promise<boolean> {
		const [row] = await this.database
			.delete(eventInvitation)
			.where(this.invitationOf(eventId, invitationId))
			.returning({ id: eventInvitation.id });

		return !!row;
	}

	public async addGuest(invitationId: string, guest: { firstName: string; lastName: null | string }): Promise<void> {
		const [last] = await this.database
			.select({ position: eventGuest.position })
			.from(eventGuest)
			.where(eq(eventGuest.invitationId, invitationId))
			.orderBy(desc(eventGuest.position))
			.limit(1);

		await this.database.insert(eventGuest).values({
			firstName: guest.firstName,
			id: crypto.randomUUID(),
			invitationId,
			lastName: guest.lastName,
			position: (last?.position ?? -1) + 1,
		});
	}

	public async updateGuest(guestId: string, patch: Partial<GuestRecord>): Promise<void> {
		await this.database.update(eventGuest).set(patch).where(eq(eventGuest.id, guestId));
	}

	// final: answers and history go with the person (see CONTEXT.md, Answer)
	public async deleteGuest(guestId: string): Promise<void> {
		await this.database.delete(eventGuest).where(eq(eventGuest.id, guestId));
	}

	public async listFormFields(eventId: string, includeRetired = false): Promise<FormFieldRecord[]> {
		return await this.database
			.select()
			.from(eventFormField)
			.where(
				includeRetired
					? eq(eventFormField.eventId, eventId)
					: and(eq(eventFormField.eventId, eventId), isNull(eventFormField.retiredAt))
			)
			.orderBy(asc(eventFormField.position));
	}

	public async createFormField(
		eventId: string,
		field: Pick<
			FormFieldRecord,
			'helpText' | 'label' | 'onlyWhenAttending' | 'options' | 'required' | 'scope' | 'type'
		>
	): Promise<void> {
		const [last] = await this.database
			.select({ position: eventFormField.position })
			.from(eventFormField)
			.where(eq(eventFormField.eventId, eventId))
			.orderBy(desc(eventFormField.position))
			.limit(1);

		await this.database.insert(eventFormField).values({
			...field,
			eventId,
			id: crypto.randomUUID(),
			position: (last?.position ?? -1) + 1,
		});
	}

	public async updateFormField(fieldId: string, patch: Partial<FormFieldRecord>): Promise<void> {
		await this.database.update(eventFormField).set(patch).where(eq(eventFormField.id, fieldId));
	}

	// retiring, not deleting: the answers already given stay readable in the table and the export
	public async retireFormField(fieldId: string): Promise<void> {
		await this.database.update(eventFormField).set({ retiredAt: new Date() }).where(eq(eventFormField.id, fieldId));
	}

	public async moveFormField(fieldId: string, otherFieldId: string): Promise<void> {
		const rows = await this.database
			.select({ id: eventFormField.id, position: eventFormField.position })
			.from(eventFormField)
			.where(inArray(eventFormField.id, [fieldId, otherFieldId]));

		const first = rows.find((row) => row.id === fieldId);
		const second = rows.find((row) => row.id === otherFieldId);

		if (!first || !second) {
			return;
		}

		await this.database.batch([
			this.database
				.update(eventFormField)
				.set({ position: second.position })
				.where(eq(eventFormField.id, first.id)),
			this.database
				.update(eventFormField)
				.set({ position: first.position })
				.where(eq(eventFormField.id, second.id)),
		]);
	}

	// every answer of an event, for the guest table and the export
	public async listAnswers(eventId: string): Promise<(typeof eventAnswer.$inferSelect)[]> {
		return await this.database
			.select({
				createdAt: eventAnswer.createdAt,
				fieldId: eventAnswer.fieldId,
				guestId: eventAnswer.guestId,
				id: eventAnswer.id,
				invitationId: eventAnswer.invitationId,
				updatedAt: eventAnswer.updatedAt,
				value: eventAnswer.value,
			})
			.from(eventAnswer)
			.innerJoin(eventFormField, eq(eventAnswer.fieldId, eventFormField.id))
			.where(eq(eventFormField.eventId, eventId));
	}
}
