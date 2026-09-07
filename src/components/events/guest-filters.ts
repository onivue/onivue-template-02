import type { InvitationRecord } from '@/lib/events/event-repository';

// which invitations a host is looking at right now. pure, so the rules are testable without a
// browser — and so "search" cannot quietly start meaning something different per column.

export type GuestFilter = {
	response: 'accepted' | 'all' | 'declined' | 'open';
	search: string;
	sent: 'all' | 'sent' | 'unsent';
};

export const EMPTY_FILTER: GuestFilter = { response: 'all', search: '', sent: 'all' };

export function guestFullName(guest: { firstName: string; lastName: null | string }): string {
	return [guest.firstName, guest.lastName].filter(Boolean).join(' ');
}

function matchesSearch(invitation: InvitationRecord, search: string): boolean {
	const needle = search.trim().toLowerCase();

	if (!needle) {
		return true;
	}

	// name, e-mail and the host's own note: the three things a host actually remembers someone by
	return invitation.guests.some((guest) =>
		[guestFullName(guest), guest.email ?? '', guest.note ?? ''].some((field) =>
			field.toLowerCase().includes(needle)
		)
	);
}

// an invitation matches a response filter when any of its people match: the invitation is the row,
// the people are what it holds
function matchesResponse(invitation: InvitationRecord, response: GuestFilter['response']): boolean {
	return response === 'all' || invitation.guests.some((guest) => guest.response === response);
}

function matchesSent(invitation: InvitationRecord, sent: GuestFilter['sent']): boolean {
	if (sent === 'all') {
		return true;
	}

	return sent === 'sent' ? invitation.sentAt !== null : invitation.sentAt === null;
}

export function filterInvitations(invitations: InvitationRecord[], filter: GuestFilter): InvitationRecord[] {
	return invitations.filter(
		(invitation) =>
			matchesSearch(invitation, filter.search) &&
			matchesResponse(invitation, filter.response) &&
			matchesSent(invitation, filter.sent)
	);
}

export function isFilterActive(filter: GuestFilter): boolean {
	return filter.response !== 'all' || filter.sent !== 'all' || filter.search.trim() !== '';
}
