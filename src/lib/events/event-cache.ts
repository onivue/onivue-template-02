import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

import type { EventListItem, EventRecord, FormFieldRecord, InvitationRecord } from '@/lib/events/event-repository';
import type { EventStatus } from '@/lib/events/response-window';

import { eventRepository } from '@/lib/events/event-services';

// every key is an id the caller passes in, never anything read from the session, so a cache hit can
// never cross an organization. mutations expire by tag; the lifetime is only a backstop.

export const eventListTag = (organizationId: string): string => `events:${organizationId}`;
export const eventTag = (eventId: string): string => `event:${eventId}`;
export const eventInvitationsTag = (eventId: string): string => `event-invitations:${eventId}`;
export const eventFieldsTag = (eventId: string): string => `event-fields:${eventId}`;

export async function getEventList(organizationId: string, status: EventStatus): Promise<EventListItem[]> {
	'use cache';
	cacheLife('minutes');
	cacheTag(eventListTag(organizationId));

	return await eventRepository.listEvents(organizationId, status);
}

export async function getEvent(eventId: string, organizationId: string): Promise<EventRecord | null> {
	'use cache';
	cacheLife('minutes');
	cacheTag(eventTag(eventId));

	return await eventRepository.findEvent(eventId, organizationId);
}

export async function getEventInvitations(eventId: string): Promise<InvitationRecord[]> {
	'use cache';
	cacheLife('minutes');
	cacheTag(eventInvitationsTag(eventId));

	return await eventRepository.listInvitations(eventId);
}

export async function getEventFormFields(eventId: string): Promise<FormFieldRecord[]> {
	'use cache';
	cacheLife('minutes');
	cacheTag(eventFieldsTag(eventId));

	return await eventRepository.listFormFields(eventId);
}
