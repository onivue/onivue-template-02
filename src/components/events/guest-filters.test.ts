import { describe, expect, test } from 'bun:test';

import type { InvitationRecord } from '@/lib/events/event-repository';

import { EMPTY_FILTER, filterInvitations, isFilterActive } from '@/components/events/guest-filters';

function guest(overrides: Partial<InvitationRecord['guests'][number]> = {}) {
	return {
		ageGroup: 'adult' as const,
		createdAt: new Date(),
		email: null,
		firstName: 'Anna',
		id: 'g1',
		invitationId: 'inv1',
		isMainGuest: true,
		lastName: 'Meier',
		note: null,
		position: 0,
		respondedAt: null,
		response: 'open' as const,
		updatedAt: new Date(),
		...overrides,
	};
}

function invitation(overrides: Partial<InvitationRecord> = {}): InvitationRecord {
	return {
		guests: [guest()],
		id: 'inv1',
		lastViewedAt: null,
		responseDeadline: null,
		sentAt: null,
		token: 'tok1',
		viewCount: 0,
		...overrides,
	};
}

const ANNA = invitation();
const BEN = invitation({
	guests: [guest({ firstName: 'Ben', id: 'g2', lastName: 'Schmidt', response: 'accepted' })],
	id: 'inv2',
	sentAt: new Date(),
	token: 'tok2',
});

describe('filtering the guest list', () => {
	test('no filter shows everything', () => {
		expect(filterInvitations([ANNA, BEN], EMPTY_FILTER)).toHaveLength(2);
		expect(isFilterActive(EMPTY_FILTER)).toBe(false);
	});

	test('search matches a name regardless of case', () => {
		expect(filterInvitations([ANNA, BEN], { ...EMPTY_FILTER, search: 'schmidt' })).toEqual([BEN]);
		expect(filterInvitations([ANNA, BEN], { ...EMPTY_FILTER, search: '  ANNA ' })).toEqual([ANNA]);
	});

	test('search also finds an e-mail and the host&apos;s own note', () => {
		const withNote = invitation({
			guests: [guest({ email: 'oma@example.com', note: 'kommt aus Hamburg' })],
			id: 'inv3',
			token: 'tok3',
		});

		expect(filterInvitations([withNote], { ...EMPTY_FILTER, search: 'hamburg' })).toEqual([withNote]);
		expect(filterInvitations([withNote], { ...EMPTY_FILTER, search: 'oma@' })).toEqual([withNote]);
	});

	test('a response filter keeps an invitation when any of its people match', () => {
		const mixed = invitation({
			guests: [guest(), guest({ firstName: 'Ben', id: 'g3', response: 'accepted' })],
			id: 'inv4',
			token: 'tok4',
		});

		expect(filterInvitations([mixed], { ...EMPTY_FILTER, response: 'accepted' })).toEqual([mixed]);
		expect(filterInvitations([mixed], { ...EMPTY_FILTER, response: 'declined' })).toEqual([]);
	});

	test('the sent filter separates what still has to go out', () => {
		expect(filterInvitations([ANNA, BEN], { ...EMPTY_FILTER, sent: 'unsent' })).toEqual([ANNA]);
		expect(filterInvitations([ANNA, BEN], { ...EMPTY_FILTER, sent: 'sent' })).toEqual([BEN]);
	});

	test('filters combine rather than replace each other', () => {
		expect(filterInvitations([ANNA, BEN], { response: 'accepted', search: 'ben', sent: 'sent' })).toEqual([BEN]);
		expect(filterInvitations([ANNA, BEN], { response: 'accepted', search: 'ben', sent: 'unsent' })).toEqual([]);
	});

	test('an active filter is recognised, so the list can say what it is hiding', () => {
		expect(isFilterActive({ ...EMPTY_FILTER, search: '   ' })).toBe(false);
		expect(isFilterActive({ ...EMPTY_FILTER, search: 'a' })).toBe(true);
		expect(isFilterActive({ ...EMPTY_FILTER, sent: 'unsent' })).toBe(true);
	});
});
