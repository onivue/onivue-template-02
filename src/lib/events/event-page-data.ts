import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { Membership } from '@/lib/auth/personal-organization';
import type { EventRecord, FormFieldRecord, InvitationRecord } from '@/lib/events/event-repository';

import { getActiveMembership } from '@/lib/auth/active-organization';
import { getEvent, getEventFormFields, getEventInvitations } from '@/lib/events/event-cache';

export type EventPageData = {
	event: EventRecord;
	membership: Membership;
};

// a layout cannot guard a page — next renders them in parallel — so the check lives in the loader
// they share. the guard is the query: getEvent is org-scoped, so someone else's event reads as null.
export const loadEvent = cache(async (eventId: string): Promise<EventPageData> => {
	const membership = await getActiveMembership();
	const event = await getEvent(eventId, membership.organizationId);

	if (!event) {
		notFound();
	}

	return { event, membership };
});

// a section streams on its own, so a sibling's notFound() may arrive after it was already sent —
// each one passes the gate itself, which react's cache makes free.
export const loadEventInvitations = cache(async (eventId: string): Promise<InvitationRecord[]> => {
	const { event } = await loadEvent(eventId);

	return await getEventInvitations(event.id);
});

export const loadEventFormFields = cache(async (eventId: string): Promise<FormFieldRecord[]> => {
	const { event } = await loadEvent(eventId);

	return await getEventFormFields(event.id);
});
