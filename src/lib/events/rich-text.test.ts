import { describe, expect, test } from 'bun:test';

import {
	EMPTY_RICH_TEXT,
	isRichTextEmpty,
	parseRichText,
	richTextToPlainText,
	serializeRichText,
} from '@/lib/events/rich-text';

const bold = { marks: [{ type: 'bold' as const }], text: 'Grillfest', type: 'text' as const };

describe('reading a column', () => {
	test('nothing written is an empty document', () => {
		expect(parseRichText(null)).toEqual(EMPTY_RICH_TEXT);
		expect(parseRichText('   ')).toEqual(EMPTY_RICH_TEXT);
	});

	test('a text written before rich text existed keeps its line breaks', () => {
		expect(richTextToPlainText(parseRichText('Wir feiern!\nKomm vorbei.'))).toBe('Wir feiern!\nKomm vorbei.');
	});

	test('a serialized document comes back as it went in', () => {
		const document = parseRichText('Wir feiern!');

		expect(parseRichText(serializeRichText(document))).toEqual(document);
	});

	test('json that is not a document reads as empty rather than throwing', () => {
		expect(parseRichText('{"type":"doc","content":[{"type":"heading"}]}')).toEqual(EMPTY_RICH_TEXT);
	});

	test('a broken json string falls back to the text it looks like', () => {
		expect(richTextToPlainText(parseRichText('{ kein json'))).toBe('{ kein json');
	});
});

describe('writing a column', () => {
	test('an empty document is stored as nothing at all', () => {
		expect(serializeRichText(EMPTY_RICH_TEXT)).toBeNull();
		expect(serializeRichText(parseRichText(''))).toBeNull();
	});

	test('a document with only blank paragraphs counts as empty', () => {
		expect(isRichTextEmpty({ content: [{ type: 'paragraph' }, { type: 'paragraph' }], type: 'doc' })).toBe(true);
	});
});

describe('flattening to plain text', () => {
	test('marks fall away, the words stay', () => {
		expect(richTextToPlainText({ content: [{ content: [bold], type: 'paragraph' }], type: 'doc' })).toBe(
			'Grillfest'
		);
	});

	test('a list becomes one bulleted line per entry', () => {
		const document = parseRichText(
			JSON.stringify({
				content: [
					{
						content: [
							{
								content: [{ content: [{ text: 'Salat', type: 'text' }], type: 'paragraph' }],
								type: 'listItem',
							},
							{
								content: [{ content: [{ text: 'Kuchen', type: 'text' }], type: 'paragraph' }],
								type: 'listItem',
							},
						],
						type: 'bulletList',
					},
				],
				type: 'doc',
			})
		);

		expect(richTextToPlainText(document)).toBe('• Salat\n• Kuchen');
	});

	test('a soft line break inside a paragraph stays a line break', () => {
		const document = parseRichText(
			JSON.stringify({
				content: [
					{
						content: [
							{ text: 'Parkplätze', type: 'text' },
							{ type: 'hardBreak' },
							{ text: 'hinter dem Haus', type: 'text' },
						],
						type: 'paragraph',
					},
				],
				type: 'doc',
			})
		);

		expect(richTextToPlainText(document)).toBe('Parkplätze\nhinter dem Haus');
	});
});
