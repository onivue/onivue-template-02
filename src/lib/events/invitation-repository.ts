import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import type { db } from '@/db/client';
import type { FormFieldDefinition } from '@/lib/events/form-schema';
import type { InvitationState } from '@/lib/events/response-plan';
import type { EventStatus } from '@/lib/events/response-window';

import { event, eventAnswer, eventFormField, eventGuest, eventInvitation } from '@/db/schema';

// counted in the statement, never read and written back: two guests opening the same link at the
// same moment must not settle on one view
export const VIEW_INCREMENT = sql`${eventInvitation.viewCount} + 1`;

// the guest side. one lookup by token, one shape carrying everything the page renders — a guest
// page that had to make five round trips would be five chances to leak something else.

export type InvitationGuest = {
	firstName: string;
	id: string;
	isMainGuest: boolean;
	lastName: null | string;
	respondedAt: Date | null;
	response: 'accepted' | 'declined' | 'open';
};

export type InvitationEvent = {
	decoration: null | string;
	endsAt: Date | null;
	// neither is ever shown to the guest; the response action needs both to expire the host's
	// guest list and the counts on their event card
	id: string;
	organizationId: string;
	greeting: null | string;
	locationCity: null | string;
	locationLatitude: null | number;
	locationLongitude: null | number;
	locationName: null | string;
	locationPostalCode: null | string;
	locationStreet: null | string;
	responseDeadline: Date | null;
	startsAt: Date | null;
	status: EventStatus;
	title: string;
};

export type InvitationView = {
	answers: InvitationState['answers'];
	event: InvitationEvent;
	fields: FormFieldDefinition[];
	guests: InvitationGuest[];
	invitationId: string;
	responseDeadline: Date | null;
	updatedAt: Date;
};

export class InvitationRepository {
	public constructor(private readonly database: typeof db) {}

	// a deleted event takes its invitations with it, so an unknown token and a deleted event are
	// indistinguishable here — which is exactly what the guest page reports
	public async findByToken(token: string): Promise<InvitationView | null> {
		const [row] = await this.database
			.select({
				decoration: event.decoration,
				endsAt: event.endsAt,
				eventId: event.id,
				eventStatus: event.status,
				greeting: event.greeting,
				invitationDeadline: eventInvitation.responseDeadline,
				invitationId: eventInvitation.id,
				locationCity: event.locationCity,
				locationLatitude: event.locationLatitude,
				locationLongitude: event.locationLongitude,
				locationName: event.locationName,
				locationPostalCode: event.locationPostalCode,
				locationStreet: event.locationStreet,
				organizationId: event.organizationId,
				responseDeadline: event.responseDeadline,
				startsAt: event.startsAt,
				title: event.title,
				updatedAt: eventInvitation.updatedAt,
			})
			.from(eventInvitation)
			.innerJoin(event, eq(eventInvitation.eventId, event.id))
			.where(eq(eventInvitation.token, token))
			.limit(1);

		if (!row) {
			return null;
		}

		const [guests, fields, answers] = await Promise.all([
			this.database
				.select({
					firstName: eventGuest.firstName,
					id: eventGuest.id,
					isMainGuest: eventGuest.isMainGuest,
					lastName: eventGuest.lastName,
					respondedAt: eventGuest.respondedAt,
					response: eventGuest.response,
				})
				.from(eventGuest)
				.where(eq(eventGuest.invitationId, row.invitationId))
				.orderBy(asc(eventGuest.position)),
			this.database
				.select()
				.from(eventFormField)
				.where(and(eq(eventFormField.eventId, row.eventId), isNull(eventFormField.retiredAt)))
				.orderBy(asc(eventFormField.position)),
			this.answersFor(row.invitationId),
		]);

		return {
			answers,
			event: {
				decoration: row.decoration,
				endsAt: row.endsAt,
				id: row.eventId,
				greeting: row.greeting,
				locationCity: row.locationCity,
				locationLatitude: row.locationLatitude,
				locationLongitude: row.locationLongitude,
				locationName: row.locationName,
				locationPostalCode: row.locationPostalCode,
				locationStreet: row.locationStreet,
				organizationId: row.organizationId,
				responseDeadline: row.responseDeadline,
				startsAt: row.startsAt,
				status: row.eventStatus,
				title: row.title,
			},
			fields: fields.map((field) => ({
				helpText: field.helpText,
				id: field.id,
				label: field.label,
				onlyWhenAttending: field.onlyWhenAttending,
				options: field.options,
				required: field.required,
				retiredAt: field.retiredAt,
				scope: field.scope,
				type: field.type,
			})),
			guests,
			invitationId: row.invitationId,
			responseDeadline: row.invitationDeadline,
			updatedAt: row.updatedAt,
		};
	}

	// the guest's own answers: theirs and the invitation's, never another household's
	// keyed by the token, so a view costs one statement
	public async recordView(token: string): Promise<void> {
		await this.database
			.update(eventInvitation)
			.set({ lastViewedAt: new Date(), viewCount: VIEW_INCREMENT })
			.where(eq(eventInvitation.token, token));
	}

	private async answersFor(invitationId: string): Promise<InvitationState['answers']> {
		const guestAnswers = await this.database
			.select({ fieldId: eventAnswer.fieldId, guestId: eventAnswer.guestId, value: eventAnswer.value })
			.from(eventAnswer)
			.innerJoin(eventGuest, eq(eventAnswer.guestId, eventGuest.id))
			.where(eq(eventGuest.invitationId, invitationId));

		const invitationAnswers = await this.database
			.select({ fieldId: eventAnswer.fieldId, guestId: eventAnswer.guestId, value: eventAnswer.value })
			.from(eventAnswer)
			.where(eq(eventAnswer.invitationId, invitationId));

		return [...guestAnswers, ...invitationAnswers];
	}
}

export function toInvitationState(view: InvitationView): InvitationState {
	return {
		answers: view.answers,
		guests: view.guests.map((guest) => ({
			id: guest.id,
			respondedAt: guest.respondedAt,
			response: guest.response,
		})),
	};
}
