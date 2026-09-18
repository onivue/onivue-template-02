import type { TGuestResponse, TMcpAppInvitation } from '@/features/mcp-app/app-contract';

// an invitation holds a party, not a person, so its status is the party's answer taken together:
// everyone said yes, everyone said no, nobody has answered yet, or the party is split.

export type TInvitationStatus = 'accepted' | 'declined' | 'open' | 'partial';

export type TInvitationTally = Record<TGuestResponse, number>;

const EMPTY_TALLY: TInvitationTally = { accepted: 0, declined: 0, open: 0 };

export const INVITATION_STATUS_LABELS: Record<TInvitationStatus, string> = {
	accepted: 'zugesagt',
	declined: 'abgesagt',
	open: 'offen',
	partial: 'teils zugesagt',
};

export function tallyResponses(invitation: TMcpAppInvitation): TInvitationTally {
	return invitation.guests.reduce(
		(tally, guest) => ({ ...tally, [guest.response]: tally[guest.response] + 1 }),
		EMPTY_TALLY
	);
}

export function invitationStatus(invitation: TMcpAppInvitation): TInvitationStatus {
	const total = invitation.guests.length;
	const tally = tallyResponses(invitation);

	if (total === 0 || tally.open === total) {
		return 'open';
	}

	if (tally.accepted === total) {
		return 'accepted';
	}

	if (tally.declined === total) {
		return 'declined';
	}

	return 'partial';
}
