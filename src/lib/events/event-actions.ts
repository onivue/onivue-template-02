'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { ActionResult } from '@/lib/events/action-result';
import type { EventPatch } from '@/lib/events/event-repository';

import { APP_ROUTES, eventPath } from '@/config/routes';
import { getActiveMembership } from '@/lib/auth/active-organization';
import { requireViewer } from '@/lib/auth/viewer';
import { accessFailure, ACTION_MESSAGES, failure, ok } from '@/lib/events/action-result';
import { parseBerlinDateTime } from '@/lib/events/berlin-time';
import { isDecorationKey } from '@/lib/events/event-decoration';
import { eventAccess, eventRepository } from '@/lib/events/event-services';

const titleSchema = z.string().trim().min(1, 'Ein Titel fehlt.').max(120, 'Der Titel ist zu lang.');

// a maps deep link, pasted in as-is — either app, both, or neither
const mapsUrlSchema = z
	.string()
	.trim()
	.max(1000)
	.refine((value) => value === '' || /^https:\/\//i.test(value), 'Der Link muss mit https:// beginnen.')
	.optional();

const detailsSchema = z.object({
	// '' is "no ornament"; anything else has to be one the app actually knows how to draw
	decoration: z
		.string()
		.refine((value) => value === '' || isDecorationKey(value), 'Dieses 3D-Element gibt es nicht.')
		.optional(),
	endsAt: z.string().optional(),
	greeting: z.string().max(2000).optional(),
	location: z.string().max(500).optional(),
	locationAppleMapsUrl: mapsUrlSchema,
	locationGoogleMapsUrl: mapsUrlSchema,
	responseDeadline: z.string().optional(),
	startsAt: z.string().optional(),
	title: titleSchema,
});

function emptyToNull(value: string | undefined): null | string {
	const trimmed = value?.trim();

	return trimmed ? trimmed : null;
}

export async function createEvent(input: { title: string }): Promise<ActionResult<{ eventId: string }>> {
	const viewer = await requireViewer();
	const membership = await getActiveMembership();
	const parsed = titleSchema.safeParse(input.title);

	if (!parsed.success) {
		return failure(parsed.error.issues[0]?.message ?? ACTION_MESSAGES.invalid);
	}

	const eventId = await eventRepository.createEvent({
		createdByUserId: viewer.id,
		organizationId: membership.organizationId,
		title: parsed.data,
	});

	revalidatePath(APP_ROUTES.EVENTS);

	return ok({ eventId });
}

export async function updateEventDetails(eventId: string, input: z.input<typeof detailsSchema>): Promise<ActionResult> {
	const membership = await getActiveMembership();
	const access = await eventAccess.forManaging(eventId, membership);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const parsed = detailsSchema.safeParse(input);

	if (!parsed.success) {
		return failure(parsed.error.issues[0]?.message ?? ACTION_MESSAGES.invalid);
	}

	const patch: EventPatch = {
		decoration: emptyToNull(parsed.data.decoration),
		endsAt: parseBerlinDateTime(parsed.data.endsAt),
		greeting: emptyToNull(parsed.data.greeting),
		location: emptyToNull(parsed.data.location),
		locationAppleMapsUrl: emptyToNull(parsed.data.locationAppleMapsUrl),
		locationGoogleMapsUrl: emptyToNull(parsed.data.locationGoogleMapsUrl),
		responseDeadline: parseBerlinDateTime(parsed.data.responseDeadline, 'end-of-day'),
		startsAt: parseBerlinDateTime(parsed.data.startsAt),
		title: parsed.data.title,
	};

	await eventRepository.updateEvent(eventId, patch);

	// the title and date show on the card too, so the list goes with it
	revalidatePath(eventPath(eventId, 'settings'));
	revalidatePath(eventPath(eventId));
	revalidatePath(APP_ROUTES.EVENTS);

	return ok();
}

// archiving retires the event without breaking a single link that has already gone out: they keep
// resolving, they just stop accepting changes
export async function setEventStatus(eventId: string, status: 'active' | 'archived'): Promise<ActionResult> {
	const membership = await getActiveMembership();
	const access = await eventAccess.forManaging(eventId, membership);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.setEventStatus(eventId, status);

	revalidatePath(eventPath(eventId));
	revalidatePath(APP_ROUTES.EVENTS);

	return ok();
}

// final. the title has to be typed out, because there is no restore and the links die instantly.
export async function deleteEvent(eventId: string, confirmation: string): Promise<ActionResult> {
	const membership = await getActiveMembership();
	const access = await eventAccess.forDeleting(eventId, membership);

	if (!access.success) {
		return accessFailure(access.error);
	}

	if (confirmation.trim() !== access.data.title) {
		return failure(ACTION_MESSAGES.titleMismatch);
	}

	await eventRepository.deleteEvent(eventId);

	revalidatePath(APP_ROUTES.EVENTS);

	return ok();
}
