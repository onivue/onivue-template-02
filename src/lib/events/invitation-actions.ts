'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';

import type { ActionResult } from '@/lib/events/action-result';
import type { EventSummary } from '@/lib/events/event-access';
import type { GuestListIssue } from '@/lib/events/guest-list-parser';

import { getActiveMembership } from '@/lib/auth/active-organization';
import { accessFailure, ACTION_MESSAGES, failure, ok } from '@/lib/events/action-result';
import { parseBerlinDateTime } from '@/lib/events/berlin-time';
import { eventGuestsTag, eventListTag } from '@/lib/events/event-cache';
import { eventAccess, eventRepository } from '@/lib/events/event-services';
import { parseGuestList, toGuest } from '@/lib/events/guest-list-parser';

const nameSchema = z.string().trim().min(1, 'Ein Name fehlt.').max(80, 'Der Name ist zu lang.');

async function guard(eventId: string) {
	const membership = await getActiveMembership();

	return await eventAccess.forManaging(eventId, membership);
}

// the guest list sits on the overview page, and the same rows feed the counts on the card in the list
function expireGuests(event: EventSummary): void {
	updateTag(eventGuestsTag(event.id));
	updateTag(eventListTag(event.organizationId));
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

	expireGuests(access.data);

	return ok({ created, issues });
}

// the host's own bookkeeping: the app never sends anything itself
export async function setInvitationSent(eventId: string, invitationId: string, sent: boolean): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.markSent(eventId, invitationId, sent ? new Date() : null);

	expireGuests(access.data);

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

	const token = await eventRepository.rotateToken(eventId, invitationId);

	if (!token) {
		return failure(ACTION_MESSAGES.invitationNotFound);
	}

	expireGuests(access.data);

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

	await eventRepository.setInvitationDeadline(eventId, invitationId, parseBerlinDateTime(value, 'end-of-day'));

	expireGuests(access.data);

	return ok();
}

export async function resetInvitationViews(eventId: string, invitationId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.resetInvitationViews(eventId, invitationId);

	expireGuests(access.data);

	return ok();
}

export async function removeInvitation(eventId: string, invitationId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.deleteInvitation(eventId, invitationId);

	expireGuests(access.data);

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

	const guest = toGuest(parsed.data);

	if (!guest) {
		return failure(ACTION_MESSAGES.invalid);
	}

	await eventRepository.addGuest(invitationId, guest);

	expireGuests(access.data);

	return ok();
}

// the name changes, the answers and the history stay with the same person
export async function renameGuest(eventId: string, guestId: string, name: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const parsed = nameSchema.safeParse(name);

	if (!parsed.success) {
		return failure(parsed.error.issues[0]?.message ?? ACTION_MESSAGES.invalid);
	}

	const guest = toGuest(parsed.data);

	if (!guest) {
		return failure(ACTION_MESSAGES.invalid);
	}

	await eventRepository.updateGuest(guestId, { firstName: guest.firstName, lastName: guest.lastName });

	expireGuests(access.data);

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

	expireGuests(access.data);

	return ok();
}

// final: the answers and the history of that person go with them
export async function removeGuest(eventId: string, guestId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.deleteGuest(guestId);

	expireGuests(access.data);

	return ok();
}
