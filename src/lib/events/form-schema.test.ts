import { describe, expect, test } from 'bun:test';

import { buildSubmissionSchema, type FormFieldDefinition, isFieldVisible } from '@/lib/events/form-schema';

function field(
	overrides: Partial<FormFieldDefinition> & Pick<FormFieldDefinition, 'id' | 'type'>
): FormFieldDefinition {
	return {
		helpText: null,
		label: overrides.id,
		onlyWhenAttending: false,
		options: [],
		required: false,
		retiredAt: null,
		scope: 'guest',
		...overrides,
	};
}

const MENU = field({
	id: 'menu',
	onlyWhenAttending: true,
	options: [
		{ id: 'veg', label: 'Vegetarisch' },
		{ id: 'meat', label: 'Fleisch' },
	],
	required: true,
	type: 'select',
});

const NOTE = field({ id: 'note', scope: 'invitation', type: 'textarea' });

function submit(
	guests: Record<string, { answers?: Record<string, string | string[]>; response: string }>,
	answers = {}
) {
	return {
		answers,
		guests: Object.fromEntries(
			Object.entries(guests).map(([id, guest]) => [
				id,
				{ answers: guest.answers ?? {}, response: guest.response },
			])
		),
	};
}

describe('field visibility', () => {
	test('an attending-only field hides from anyone not attending', () => {
		expect(isFieldVisible(MENU, 'accepted')).toBe(true);
		expect(isFieldVisible(MENU, 'declined')).toBe(false);
		expect(isFieldVisible(MENU, 'open')).toBe(false);
	});

	test('a retired field is invisible to everyone', () => {
		expect(isFieldVisible({ ...MENU, retiredAt: new Date() }, 'accepted')).toBe(false);
	});

	test('an invitation field ignores attendance, since an invitation has no response', () => {
		expect(isFieldVisible({ ...NOTE, onlyWhenAttending: true }, 'declined')).toBe(true);
	});
});

describe('validating a submission', () => {
	const schema = buildSubmissionSchema([MENU, NOTE], ['g1', 'g2']);

	test('an attending guest must answer a required field', () => {
		const result = schema.safeParse(submit({ g1: { response: 'accepted' } }));

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(['guests', 'g1', 'answers', 'menu']);
		expect(result.error?.issues[0]?.message).toBe('Diese Angabe fehlt.');
	});

	test('declining is always one click, required fields or not', () => {
		const result = schema.safeParse(submit({ g1: { response: 'declined' } }));

		expect(result.success).toBe(true);
		expect(result.data?.guests.g1?.answers).toEqual({});
	});

	test('a value outside the options is refused', () => {
		const result = schema.safeParse(submit({ g1: { answers: { menu: 'fisch' }, response: 'accepted' } }));

		expect(result.error?.issues[0]?.message).toBe('Diese Auswahl gibt es nicht.');
	});

	test('an answer to a hidden field is dropped rather than stored', () => {
		const result = schema.safeParse(submit({ g1: { answers: { menu: 'veg' }, response: 'declined' } }));

		expect(result.success).toBe(true);
		expect(result.data?.guests.g1?.answers).toEqual({});
	});

	test('an answer to a retired field is dropped without complaint', () => {
		const retired = buildSubmissionSchema([{ ...MENU, retiredAt: new Date() }], ['g1']);
		const result = retired.safeParse(submit({ g1: { answers: { menu: 'veg' }, response: 'accepted' } }));

		expect(result.success).toBe(true);
		expect(result.data?.guests.g1?.answers).toEqual({});
	});

	test('a guest who is not on this invitation is refused', () => {
		const result = schema.safeParse(submit({ stranger: { response: 'accepted' } }));

		expect(result.error?.issues[0]?.message).toBe('Diese Person gehört nicht zu dieser Einladung.');
	});

	test('an invitation field is only demanded when somebody is attending', () => {
		const required = buildSubmissionSchema([{ ...NOTE, required: true }], ['g1']);

		expect(required.safeParse(submit({ g1: { response: 'declined' } })).success).toBe(true);
		expect(required.safeParse(submit({ g1: { response: 'accepted' } })).success).toBe(false);
	});

	test('text is trimmed, and over-long text is refused', () => {
		const text = buildSubmissionSchema([field({ id: 'wish', type: 'text' })], ['g1']);

		expect(
			text.safeParse(submit({ g1: { answers: { wish: '  Kuchen  ' }, response: 'accepted' } })).data?.guests.g1
				?.answers
		).toEqual({ wish: 'Kuchen' });
		expect(
			text.safeParse(submit({ g1: { answers: { wish: 'x'.repeat(201) }, response: 'accepted' } })).success
		).toBe(false);
	});

	test('a checkbox keeps a list, deduplicates it, and refuses unknown options', () => {
		const box = buildSubmissionSchema(
			[
				field({
					id: 'extras',
					options: [
						{ id: 'bus', label: 'Bus' },
						{ id: 'bett', label: 'Bett' },
					],
					type: 'checkbox',
				}),
			],
			['g1']
		);

		expect(
			box.safeParse(submit({ g1: { answers: { extras: ['bus', 'bus'] }, response: 'accepted' } })).data?.guests.g1
				?.answers
		).toEqual({ extras: ['bus'] });
		expect(
			box.safeParse(submit({ g1: { answers: { extras: 'bus' }, response: 'accepted' } })).data?.guests.g1?.answers
		).toEqual({ extras: ['bus'] });
		expect(box.safeParse(submit({ g1: { answers: { extras: ['zug'] }, response: 'accepted' } })).success).toBe(
			false
		);
	});

	test('an unanswered optional field comes back as an empty value, so it can clear an old answer', () => {
		const optional = buildSubmissionSchema([field({ id: 'wish', type: 'text' })], ['g1']);

		expect(optional.safeParse(submit({ g1: { response: 'accepted' } })).data?.guests.g1?.answers).toEqual({
			wish: '',
		});
	});
});
