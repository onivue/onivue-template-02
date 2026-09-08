import type { EventListItem, InvitationRecord } from '@/lib/events/event-repository';

// the overview already holds every invitation, so these need no aggregate query of their own
export function countInvitations(invitations: InvitationRecord[]): EventListItem['counts'] {
	const counts = { accepted: 0, declined: 0, invitations: 0, open: 0, unsent: 0 };

	for (const invitation of invitations) {
		counts.invitations += 1;

		if (!invitation.sentAt) {
			counts.unsent += 1;
		}

		for (const guest of invitation.guests) {
			counts[guest.response] += 1;
		}
	}

	return counts;
}

export function countGuests(invitations: InvitationRecord[]): number {
	return invitations.reduce((total, invitation) => total + invitation.guests.length, 0);
}
