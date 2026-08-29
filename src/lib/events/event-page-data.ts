import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { Membership } from '@/lib/auth/personal-organization';
import type { EventRecord } from '@/lib/events/event-repository';

import { getActiveMembership } from '@/lib/auth/active-organization';
import { eventAccess, eventRepository } from '@/lib/events/event-services';

export type EventPageData = {
	event: EventRecord;
	membership: Membership;
};

// every page under /events/[eventId] loads through here, layout included. a layout cannot guard a
// page — next renders them in parallel — so the check lives in the loader they all share, and
// react's cache keeps it to one query per request.
export const loadEvent = cache(async (eventId: string): Promise<EventPageData> => {
	const membership = await getActiveMembership();
	const access = await eventAccess.forManaging(eventId, membership);

	if (!access.success) {
		notFound();
	}

	const event = await eventRepository.findEvent(eventId, membership.organizationId);

	if (!event) {
		notFound();
	}

	return { event, membership };
});
