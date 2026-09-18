import { describe, expect, test } from 'bun:test';

import { EVENT_NOTE_MESSAGES, prepareEventNotes, readEventNotes } from '@/lib/events/event-note';
import { richTextFromPlainText, richTextToPlainText, parseRichText, serializeRichText } from '@/lib/events/rich-text';

const body = (text: string) => serializeRichText(richTextFromPlainText(text)) ?? '';

const draft = (overrides: Record<string, unknown> = {}) => ({
	body: body('Es gibt Kuchen.'),
	icon: 'food',
	id: 'n1',
	title: 'Essen & Trinken',
	...overrides,
});

describe('preparing what the form sent', () => {
	test('a filled section survives with its icon and title', () => {
		const result = prepareEventNotes([draft()]);

		expect(result.success).toBe(true);
		expect(result.success && result.notes).toHaveLength(1);
		expect(result.success && result.notes[0]?.icon).toBe('food');
		expect(result.success && richTextToPlainText(parseRichText(result.notes[0]?.body))).toBe('Es gibt Kuchen.');
	});

	test('a section that was added and then left alone is dropped, not refused', () => {
		const result = prepareEventNotes([draft(), draft({ body: '', id: 'n2', title: '   ' })]);

		expect(result.success && result.notes).toHaveLength(1);
	});

	test('a half filled section is refused, because neither half reads on its own', () => {
		expect(prepareEventNotes([draft({ title: '' })])).toEqual({
			message: EVENT_NOTE_MESSAGES.incomplete,
			success: false,
		});
		expect(prepareEventNotes([draft({ body: '' })])).toEqual({
			message: EVENT_NOTE_MESSAGES.incomplete,
			success: false,
		});
	});

	test('a symbol this version does not know falls back rather than failing the save', () => {
		const result = prepareEventNotes([draft({ icon: 'helicopter' })]);

		expect(result.success && result.notes[0]?.icon).toBe('info');
	});

	test('more sections than the form offers are refused', () => {
		const result = prepareEventNotes([draft(), draft({ id: 'n2' }), draft({ id: 'n3' }), draft({ id: 'n4' })]);

		expect(result).toEqual({ message: EVENT_NOTE_MESSAGES.tooMany, success: false });
	});

	test('a section without an id of its own gets one', () => {
		const result = prepareEventNotes([draft({ id: undefined })]);

		expect(result.success && result.notes[0]?.id).toBeString();
	});

	test('anything that is not a list is no sections at all', () => {
		expect(prepareEventNotes(null)).toEqual({ notes: [], success: true });
	});
});

describe('reading a column', () => {
	test('a stored list comes back', () => {
		expect(readEventNotes([draft()])).toHaveLength(1);
	});

	test('a row written by something else reads as no sections rather than throwing', () => {
		expect(readEventNotes([{ title: 'Ohne Text' }])).toEqual([]);
		expect(readEventNotes(null)).toEqual([]);
	});
});
