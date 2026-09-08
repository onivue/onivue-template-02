import { describe, expect, test } from 'bun:test';

import type { FormFieldDefinition, Submission } from '@/lib/events/form-schema';

import { summariseResponse } from '@/lib/events/response-summary';

function field(overrides: Partial<FormFieldDefinition> & { id: string; label: string }): FormFieldDefinition {
	return {
		helpText: null,
		onlyWhenAttending: false,
		options: [],
		required: false,
		retiredAt: null,
		scope: 'guest',
		type: 'text',
		...overrides,
	};
}

const GUESTS = [
	{ firstName: 'Robin', id: 'g1', lastName: 'Meier' },
	{ firstName: 'Hannah', id: 'g2', lastName: null },
];

function submission(overrides: Partial<Submission> = {}): Submission {
	return { answers: {}, guests: {}, ...overrides };
}

describe('summariseResponse', () => {
	test('names every guest with what they answered', () => {
		const summary = summariseResponse({
			fields: [field({ id: 'f1', label: 'Menüwunsch' })],
			guests: GUESTS,
			submission: submission({
				guests: {
					g1: { answers: { f1: 'Vegetarisch' }, response: 'accepted' },
					g2: { answers: {}, response: 'declined' },
				},
			}),
		});

		expect(summary.guests).toEqual([
			{ answers: [{ label: 'Menüwunsch', value: 'Vegetarisch' }], name: 'Robin Meier', response: 'accepted' },
			{ answers: [], name: 'Hannah', response: 'declined' },
		]);
		expect(summary.counts).toEqual({ accepted: 1, declined: 1, open: 0 });
	});

	test('a choice is reported by its label, never by the stored option id', () => {
		const summary = summariseResponse({
			fields: [
				field({
					id: 'f1',
					label: 'Essen',
					options: [
						{ id: 'veg-1', label: 'Vegetarisch' },
						{ id: 'fisch-2', label: 'Fisch' },
					],
					type: 'checkbox',
				}),
			],
			guests: [GUESTS[0]!],
			submission: submission({ guests: { g1: { answers: { f1: ['veg-1', 'fisch-2'] }, response: 'accepted' } } }),
		});

		expect(summary.guests[0]?.answers).toEqual([{ label: 'Essen', value: 'Vegetarisch, Fisch' }]);
	});

	test('invitation-wide answers are kept apart from the per-person ones', () => {
		const summary = summariseResponse({
			fields: [
				field({ id: 'f1', label: 'Anreise', scope: 'invitation' }),
				field({ id: 'f2', label: 'Allergien', scope: 'guest' }),
			],
			guests: [GUESTS[0]!],
			submission: submission({
				answers: { f1: 'Mit dem Zug' },
				guests: { g1: { answers: { f2: 'Nüsse' }, response: 'accepted' } },
			}),
		});

		expect(summary.answers).toEqual([{ label: 'Anreise', value: 'Mit dem Zug' }]);
		expect(summary.guests[0]?.answers).toEqual([{ label: 'Allergien', value: 'Nüsse' }]);
	});

	test('a field left empty is dropped rather than shown as a blank row', () => {
		const summary = summariseResponse({
			fields: [field({ id: 'f1', label: 'Menüwunsch' }), field({ id: 'f2', label: 'Notiz' })],
			guests: [GUESTS[0]!],
			submission: submission({ guests: { g1: { answers: { f1: 'Fisch', f2: '' }, response: 'accepted' } } }),
		});

		expect(summary.guests[0]?.answers).toEqual([{ label: 'Menüwunsch', value: 'Fisch' }]);
	});

	test('a guest the submission does not mention is left out', () => {
		const summary = summariseResponse({
			fields: [],
			guests: GUESTS,
			submission: submission({ guests: { g1: { answers: {}, response: 'accepted' } } }),
		});

		expect(summary.guests.map((guest) => guest.name)).toEqual(['Robin Meier']);
		expect(summary.counts.accepted).toBe(1);
	});
});
