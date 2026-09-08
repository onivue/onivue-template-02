'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';

import type { ActionResult } from '@/lib/events/action-result';
import type { AccessResult, EventSummary } from '@/lib/events/event-access';
import type { GuestListIssue } from '@/lib/events/guest-list-parser';

import { getActiveMembership } from '@/lib/auth/active-organization';
import { accessFailure, ACTION_MESSAGES, failure, ok } from '@/lib/events/action-result';
import { parseBerlinDateTime } from '@/lib/events/berlin-time';
import { eventInvitationsTag, eventListTag } from '@/lib/events/event-cache';
import { eventAccess, eventRepository } from '@/lib/events/event-services';
import { parseGuestList } from '@/lib/events/guest-list-parser';

const nameSchema = z.string().trim().min(1, 'Ein Name fehlt.').max(80, 'Der Name ist zu lang.');

// the organization travels with the verdict, so naming the cache entry costs no second lookup
type Guarded = AccessResult<EventSummary> & { organizationId: string };

async function guard(eventId: string): Promise<Guarded> {
	const membership = await getActiveMembership();
	const access = await eventAccess.forManaging(eventId, membership);

	return { ...access, organizationId: membership.organizationId };
}

// the same rows feed the overview list and the counts on the card, so both entries expire together
function revalidateGuests(eventId: string, organizationId: string): void {
	updateTag(eventInvitationsTag(eventId));
	updateTag(eventListTag(organizationId));
}

export async function addInvitations(
	eventId: string,
	rawList: string
): Promise<ActionResult<{ created: number; issues: GuestListIssue[] }>> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const { invitations, issues } = parseGuestList(rawList);

	if (invitations.length === 0) {
		return failure(issues[0]?.message ?? 'Es steht kein Name in der Liste.');
	}

	const created = await eventRepository.createInvitations(
		eventId,
		invitations.map((invitation) => ({ guests: invitation.guests }))
	);

	revalidateGuests(eventId, access.organizationId);

	return ok({ created, issues });
}

// the host's own bookkeeping: the app never sends anything itself
export async function setInvitationSent(eventId: string, invitationId: string, sent: boolean): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.markSent(invitationId, sent ? new Date() : null);

	revalidateGuests(eventId, access.organizationId);

	return ok();
}

// the remedy for a link that ended up in the wrong chat: the old one dies, the answers stay
export async function rotateInvitationToken(
	eventId: string,
	invitationId: string
): Promise<ActionResult<{ token: string }>> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const token = await eventRepository.rotateToken(invitationId);

	revalidateGuests(eventId, access.organizationId);

	return ok({ token });
}

export async function setInvitationDeadline(
	eventId: string,
	invitationId: string,
	value: string
): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.setInvitationDeadline(invitationId, parseBerlinDateTime(value, 'end-of-day'));

	revalidateGuests(eventId, access.organizationId);

	return ok();
}

export async function resetInvitationViews(eventId: string, invitationId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.resetInvitationViews(invitationId);

	revalidateGuests(eventId, access.organizationId);

	return ok();
}

export async function removeInvitation(eventId: string, invitationId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.deleteInvitation(invitationId);

	revalidateGuests(eventId, access.organizationId);

	return ok();
}

export async function addGuest(eventId: string, invitationId: string, name: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const parsed = nameSchema.safeParse(name);

	if (!parsed.success) {
		return failure(parsed.error.issues[0]?.message ?? ACTION_MESSAGES.invalid);
	}

	const [firstName, ...rest] = parsed.data.split(/\s+/);

	await eventRepository.addGuest(invitationId, {
		firstName: firstName ?? parsed.data,
		lastName: rest.length > 0 ? rest.join(' ') : null,
	});

	revalidateGuests(eventId, access.organizationId);

	return ok();
}

export async function updateGuest(
	eventId: string,
	guestId: string,
	patch: { ageGroup?: 'adult' | 'child'; email?: string; note?: string }
): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.updateGuest(guestId, {
		...(patch.ageGroup ? { ageGroup: patch.ageGroup } : {}),
		...(patch.email === undefined ? {} : { email: patch.email.trim() || null }),
		...(patch.note === undefined ? {} : { note: patch.note.trim() || null }),
	});

	revalidateGuests(eventId, access.organizationId);

	return ok();
}

// final: the answers and the history of that person go with them
export async function removeGuest(eventId: string, guestId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.deleteGuest(guestId);

	revalidateGuests(eventId, access.organizationId);

	return ok();
}
