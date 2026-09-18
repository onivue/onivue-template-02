import { describe, expect, test } from 'bun:test';

import type { TGuestResponse, TMcpAppInvitation } from '@/features/mcp-app/app-contract';

import { invitationStatus, tallyResponses } from '@/features/mcp-app/invitation-status';

function invitation(...responses: TGuestResponse[]): TMcpAppInvitation {
	return {
		guests: responses.map((response, index) => ({
			id: `guest-${index}`,
			isMainGuest: index === 0,
			name: `Gast ${index}`,
			response,
		})),
		id: 'invitation-1',
		sentAt: null,
	};
}

describe('invitationStatus', () => {
	test('reads as open while nobody has answered', () => {
		expect(invitationStatus(invitation('open', 'open'))).toBe('open');
	});

	test('reads as open when the invitation carries nobody', () => {
		expect(invitationStatus(invitation())).toBe('open');
	});

	test('takes the whole party together', () => {
		expect(invitationStatus(invitation('accepted', 'accepted'))).toBe('accepted');
		expect(invitationStatus(invitation('declined', 'declined'))).toBe('declined');
	});

	test('a split party is neither a yes nor a no', () => {
		expect(invitationStatus(invitation('accepted', 'declined'))).toBe('partial');
		expect(invitationStatus(invitation('accepted', 'open'))).toBe('partial');
	});
});

describe('tallyResponses', () => {
	test('counts every answer', () => {
		expect(tallyResponses(invitation('accepted', 'accepted', 'declined', 'open'))).toEqual({
			accepted: 2,
			declined: 1,
			open: 1,
		});
	});
});
