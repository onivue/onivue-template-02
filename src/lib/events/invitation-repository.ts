import { and, asc, eq, isNull } from 'drizzle-orm';

import type { db } from '@/db/client';
import type { FormFieldDefinition } from '@/lib/events/form-schema';
import type { InvitationState } from '@/lib/events/response-plan';
import type { EventStatus } from '@/lib/events/response-window';

import { event, eventAnswer, eventFormField, eventGuest, eventInvitation } from '@/db/schema';

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
	endsAt: Date | null;
	greeting: null | string;
	location: null | string;
	responseDeadline: Date | null;
	startsAt: Date | null;
	status: EventStatus;
	themeAccent: string;
	themeFont: string;
	themeHeaderImageKey: null | string;
	themeMode: 'dark' | 'light';
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
				endsAt: event.endsAt,
				eventId: event.id,
				eventStatus: event.status,
				greeting: event.greeting,
				invitationDeadline: eventInvitation.responseDeadline,
				invitationId: eventInvitation.id,
				location: event.location,
				responseDeadline: event.responseDeadline,
				startsAt: event.startsAt,
				themeAccent: event.themeAccent,
				themeFont: event.themeFont,
				themeHeaderImageKey: event.themeHeaderImageKey,
				themeMode: event.themeMode,
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
				endsAt: row.endsAt,
				greeting: row.greeting,
				location: row.location,
				responseDeadline: row.responseDeadline,
				startsAt: row.startsAt,
				status: row.eventStatus,
				themeAccent: row.themeAccent,
				themeFont: row.themeFont,
				themeHeaderImageKey: row.themeHeaderImageKey,
				themeMode: row.themeMode,
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
