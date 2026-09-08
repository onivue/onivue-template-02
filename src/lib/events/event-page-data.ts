import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { Membership } from '@/lib/auth/personal-organization';
import type { EventListItem, EventRecord, FormFieldRecord, InvitationRecord } from '@/lib/events/event-repository';
import type { EventStatus } from '@/lib/events/response-window';

import { getActiveMembership } from '@/lib/auth/active-organization';
import { eventDetailsTag, eventFormTag, eventGuestsTag, eventListTag } from '@/lib/events/event-cache';
import { eventRepository } from '@/lib/events/event-services';

export type EventPageData = {
	event: EventRecord;
	membership: Membership;
};

// every cached read below takes the organization id as an argument instead of resolving the session
// inside the scope. that is the whole trick: a headers() read in a cache scope resolves while the
// shell is being prerendered and is cut off when the prerender completes. as an argument it becomes
// part of the cache key, so another organization cannot reach the same entry either.

async function readEvent(eventId: string, organizationId: string): Promise<EventRecord | null> {
	'use cache';
	cacheLife('hours');
	cacheTag(eventDetailsTag(eventId));

	return await eventRepository.findEvent(eventId, organizationId);
}

// keyed by the event alone, like the query it wraps: loadEvent has already turned an event of
// another organization into a 404 before either of these is reached.
//
// on a shorter leash than the rest: the view counter is written by guests opening their link, and
// expiring the host's list on every one of those would leave nothing cached at all
async function readInvitations(eventId: string): Promise<InvitationRecord[]> {
	'use cache';
	cacheLife('minutes');
	cacheTag(eventGuestsTag(eventId));

	return await eventRepository.listInvitations(eventId);
}

async function readFormFields(eventId: string): Promise<FormFieldRecord[]> {
	'use cache';
	cacheLife('hours');
	cacheTag(eventFormTag(eventId));

	return await eventRepository.listFormFields(eventId);
}

async function readEvents(organizationId: string, status: EventStatus): Promise<EventListItem[]> {
	'use cache';
	cacheLife('minutes');
	cacheTag(eventListTag(organizationId));

	return await eventRepository.listEvents(organizationId, status);
}

// a layout cannot guard a page — next renders them in parallel — so the check lives in the loader
// they share. the guard is the query: readEvent is org-scoped, so someone else's event reads as null.
export const loadEvent = cache(async (eventId: string): Promise<EventPageData> => {
	const membership = await getActiveMembership();
	const event = await readEvent(eventId, membership.organizationId);

	if (!event) {
		notFound();
	}

	return { event, membership };
});

// a section streams on its own, so a sibling's notFound() may arrive after it was already sent —
// each one passes the gate itself, which react's cache makes free.
export const loadEventInvitations = cache(async (eventId: string): Promise<InvitationRecord[]> => {
	const { event } = await loadEvent(eventId);

	return await readInvitations(event.id);
});

export const loadEventFormFields = cache(async (eventId: string): Promise<FormFieldRecord[]> => {
	const { event } = await loadEvent(eventId);

	return await readFormFields(event.id);
});

export const loadEvents = cache(async (status: EventStatus): Promise<EventListItem[]> => {
	const membership = await getActiveMembership();

	return await readEvents(membership.organizationId, status);
});
