'use server';

import { updateTag } from 'next/cache';
import { headers } from 'next/headers';
import { connection } from 'next/server';

import type { ActionResult } from '@/lib/events/action-result';

import { ACTION_MESSAGES, failure, ok } from '@/lib/events/action-result';
import { eventInvitationsTag } from '@/lib/events/event-cache';
import { guestRateLimiter, invitationRepository, responseService } from '@/lib/events/event-services';
import { buildSubmissionSchema } from '@/lib/events/form-schema';
import { toInvitationState } from '@/lib/events/invitation-repository';
import { GUEST_RATE_LIMITS, guestRateLimitKey } from '@/lib/events/rate-limiter';

const UNKNOWN_CLIENT = 'unknown';

// behind a proxy the first entry of x-forwarded-for is the client; without one there is nothing to
// key on, and everyone shares a single bucket rather than none
async function clientAddress(): Promise<string> {
	const requestHeaders = await headers();
	const forwarded = requestHeaders.get('x-forwarded-for');

	return forwarded?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || UNKNOWN_CLIENT;
}

export async function submitInvitationResponse(token: string, raw: unknown): Promise<ActionResult> {
	const limit = await guestRateLimiter.check(
		guestRateLimitKey('submit', await clientAddress()),
		GUEST_RATE_LIMITS.submit
	);

	if (!limit.allowed) {
		return failure(ACTION_MESSAGES.tooManyRequests);
	}

	const view = await invitationRepository.findByToken(token);

	// an unknown token, a replaced one and a deleted event all end here, saying the same thing
	if (!view) {
		return failure('Diese Einladung ist nicht verfügbar.');
	}

	const schema = buildSubmissionSchema(
		view.fields,
		view.guests.map((guest) => guest.id)
	);
	const parsed = schema.safeParse(raw);

	if (!parsed.success) {
		return failure(parsed.error.issues[0]?.message ?? ACTION_MESSAGES.invalid);
	}

	const result = await responseService.submit({
		actor: 'guest',
		invitationId: view.invitationId,
		state: toInvitationState(view),
		submission: parsed.data,
		window: {
			eventDeadline: view.event.responseDeadline,
			eventStatus: view.event.status,
			invitationDeadline: view.responseDeadline,
		},
	});

	if (!result.success) {
		return failure(result.error === 'archived' ? ACTION_MESSAGES.eventArchived : ACTION_MESSAGES.deadlinePassed);
	}

	// the host is the one waiting to see it, so their guest list expires here
	updateTag(eventInvitationsTag(view.event.id));

	return ok();
}

// fired from the browser, so a messenger's link preview is not counted as an opened invitation.
// silent either way: a bad token is indistinguishable from a good one here.
export async function recordInvitationView(token: string): Promise<void> {
	const limit = await guestRateLimiter.check(
		guestRateLimitKey('view', await clientAddress()),
		GUEST_RATE_LIMITS.view
	);

	if (!limit.allowed) {
		return;
	}

	await invitationRepository.recordView(token);
}

// the guest page itself is rate limited too: a token is only worth guessing if guessing is cheap.
// counting a view is a write against the clock, so it can never be part of a prerender or a prefetch
export async function checkGuestPageLimit(): Promise<boolean> {
	await connection();

	const limit = await guestRateLimiter.check(
		guestRateLimitKey('resolve', await clientAddress()),
		GUEST_RATE_LIMITS.resolve
	);

	return limit.allowed;
}
