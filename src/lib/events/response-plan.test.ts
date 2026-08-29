import { describe, expect, test } from 'bun:test';

import type { Submission } from '@/lib/events/form-schema';

import { type InvitationState, isEmptyPlan, planResponseUpdate } from '@/lib/events/response-plan';

const NOW = new Date('2026-03-01T12:00:00Z');
const EARLIER = new Date('2026-02-01T10:00:00Z');

const GUEST_CONTEXT = { actor: 'guest', now: NOW } as const;

function state(overrides: Partial<InvitationState> = {}): InvitationState {
	return {
		answers: [],
		guests: [{ id: 'g1', respondedAt: null, response: 'open' }],
		...overrides,
	};
}

function submission(overrides: Partial<Submission> = {}): Submission {
	return {
		answers: {},
		guests: { g1: { answers: {}, response: 'open' } },
		...overrides,
	};
}

describe('planning a response', () => {
	test('sending the same thing again changes nothing and logs nothing', () => {
		const plan = planResponseUpdate(
			state({ answers: [{ fieldId: 'menu', guestId: 'g1', value: 'veg' }] }),
			submission({ guests: { g1: { answers: { menu: 'veg' }, response: 'open' } } }),
			GUEST_CONTEXT
		);

		expect(isEmptyPlan(plan)).toBe(true);
	});

	test('a first response is timestamped and logged', () => {
		const plan = planResponseUpdate(
			state(),
			submission({ guests: { g1: { answers: {}, response: 'accepted' } } }),
			GUEST_CONTEXT
		);

		expect(plan.guestUpdates).toEqual([{ guestId: 'g1', respondedAt: NOW, response: 'accepted' }]);
		expect(plan.logEntries).toEqual([
			{
				actor: 'guest',
				fieldId: null,
				guestId: 'g1',
				kind: 'response',
				nextValue: 'accepted',
				previousValue: 'open',
			},
		]);
	});

	test('a later change keeps the original response time', () => {
		const plan = planResponseUpdate(
			state({ guests: [{ id: 'g1', respondedAt: EARLIER, response: 'accepted' }] }),
			submission({ guests: { g1: { answers: {}, response: 'declined' } } }),
			GUEST_CONTEXT
		);

		expect(plan.guestUpdates[0]?.respondedAt).toBe(EARLIER);
	});

	test('a new answer is written with no previous value', () => {
		const plan = planResponseUpdate(
			state(),
			submission({ guests: { g1: { answers: { menu: 'veg' }, response: 'open' } } }),
			GUEST_CONTEXT
		);

		expect(plan.answerWrites).toEqual([{ fieldId: 'menu', guestId: 'g1', value: 'veg' }]);
		expect(plan.logEntries[0]).toMatchObject({ kind: 'answer', nextValue: 'veg', previousValue: null });
	});

	test('a changed answer records what it was', () => {
		const plan = planResponseUpdate(
			state({ answers: [{ fieldId: 'menu', guestId: 'g1', value: 'veg' }] }),
			submission({ guests: { g1: { answers: { menu: 'meat' }, response: 'open' } } }),
			GUEST_CONTEXT
		);

		expect(plan.logEntries[0]).toMatchObject({ nextValue: 'meat', previousValue: 'veg' });
	});

	test('clearing an answer removes it and logs the loss', () => {
		const plan = planResponseUpdate(
			state({ answers: [{ fieldId: 'wish', guestId: 'g1', value: 'Kuchen' }] }),
			submission({ guests: { g1: { answers: { wish: '' }, response: 'open' } } }),
			GUEST_CONTEXT
		);

		expect(plan.answerRemovals).toEqual([{ fieldId: 'wish', guestId: 'g1' }]);
		expect(plan.answerWrites).toEqual([]);
		expect(plan.logEntries[0]).toMatchObject({ nextValue: null, previousValue: 'Kuchen' });
	});

	test('an empty field that was never answered is not a change', () => {
		const plan = planResponseUpdate(
			state(),
			submission({ guests: { g1: { answers: { wish: '' }, response: 'open' } } }),
			GUEST_CONTEXT
		);

		expect(isEmptyPlan(plan)).toBe(true);
	});

	test('a reordered checkbox list is not a change', () => {
		const plan = planResponseUpdate(
			state({ answers: [{ fieldId: 'extras', guestId: 'g1', value: ['bus', 'bett'] }] }),
			submission({ guests: { g1: { answers: { extras: ['bett', 'bus'] }, response: 'open' } } }),
			GUEST_CONTEXT
		);

		expect(isEmptyPlan(plan)).toBe(true);
	});

	test('an invitation answer carries no guest', () => {
		const plan = planResponseUpdate(
			state(),
			submission({ answers: { note: 'Wir kommen mit dem Zug' } }),
			GUEST_CONTEXT
		);

		expect(plan.answerWrites).toEqual([{ fieldId: 'note', guestId: null, value: 'Wir kommen mit dem Zug' }]);
		expect(plan.logEntries[0]).toMatchObject({ guestId: null, kind: 'answer' });
	});

	test('a guest the submission never mentions is left alone', () => {
		const plan = planResponseUpdate(
			state({
				guests: [
					{ id: 'g1', respondedAt: null, response: 'open' },
					{ id: 'g2', respondedAt: null, response: 'accepted' },
				],
			}),
			submission({ guests: { g1: { answers: {}, response: 'declined' } } }),
			GUEST_CONTEXT
		);

		expect(plan.guestUpdates).toEqual([{ guestId: 'g1', respondedAt: NOW, response: 'declined' }]);
	});

	test('the host is recorded as the actor when the host is the one changing things', () => {
		const plan = planResponseUpdate(
			state(),
			submission({ guests: { g1: { answers: {}, response: 'accepted' } } }),
			{ actor: 'admin', now: NOW }
		);

		expect(plan.logEntries[0]?.actor).toBe('admin');
	});
});
