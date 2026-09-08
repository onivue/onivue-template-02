import { describe, expect, test } from 'bun:test';

import type { GuestRecord, InvitationRecord } from '@/lib/events/event-repository';

import { countGuests, countInvitations } from '@/lib/events/invitation-counts';

function guest(response: GuestRecord['response']): GuestRecord {
	return { response } as GuestRecord;
}

function invitation(sentAt: Date | null, responses: GuestRecord['response'][]): InvitationRecord {
	return {
		guests: responses.map(guest),
		id: 'i',
		lastViewedAt: null,
		responseDeadline: null,
		sentAt,
		token: 't',
		viewCount: 0,
	};
}

describe('countInvitations', () => {
	test('counts every guest under its own response', () => {
		const counts = countInvitations([
			invitation(new Date(), ['accepted', 'declined']),
			invitation(null, ['open', 'accepted']),
		]);

		expect(counts).toEqual({ accepted: 2, declined: 1, invitations: 2, open: 1, unsent: 1 });
	});

	test('an event without invitations counts to zero rather than to nothing', () => {
		expect(countInvitations([])).toEqual({ accepted: 0, declined: 0, invitations: 0, open: 0, unsent: 0 });
	});

	test('counts people, not invitations', () => {
		expect(countGuests([invitation(null, ['open', 'open', 'open']), invitation(null, ['open'])])).toBe(4);
	});
});
