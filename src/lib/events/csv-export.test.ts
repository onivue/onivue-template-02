import { describe, expect, test } from 'bun:test';

import { type CsvExportInput, toCsv, toCsvFilename } from '@/lib/events/csv-export';

const MENU = {
	id: 'menu',
	label: 'Menü',
	options: [
		{ id: 'veg', label: 'Vegetarisch' },
		{ id: 'meat', label: 'Fleisch' },
	],
	retiredAt: null,
	scope: 'guest' as const,
};

const NOTE = { id: 'note', label: 'Anmerkung', options: [], retiredAt: null, scope: 'invitation' as const };

function input(overrides: Partial<CsvExportInput> = {}): CsvExportInput {
	return {
		answers: [],
		fields: [MENU, NOTE],
		formatDate: (date) => (date ? date.toISOString() : ''),
		invitations: [
			{
				guests: [
					{
						ageGroup: 'adult',
						email: null,
						firstName: 'Anna',
						id: 'g1',
						isMainGuest: true,
						lastName: 'Meier',
						note: null,
						respondedAt: null,
						response: 'accepted',
					},
				],
				id: 'inv1',
				responseDeadline: null,
				sentAt: null,
			},
		],
		...overrides,
	};
}

function rows(csv: string): string[][] {
	return csv
		.replace('﻿', '')
		.trimEnd()
		.split('\r\n')
		.map((line) => line.split(';'));
}

describe('the guest list export', () => {
	test('one row per person, with a column per field', () => {
		const table = rows(toCsv(input()));

		expect(table[0]).toContain('Menü');
		expect(table[0]).toContain('Anmerkung (Einladung)');
		expect(table[1]?.slice(0, 7)).toEqual(['1', 'ja', 'Anna', 'Meier', '', 'Erwachsen', 'zugesagt']);
	});

	test('answers appear as the label a person recognises, not as the stored id', () => {
		const table = rows(
			toCsv(input({ answers: [{ fieldId: 'menu', guestId: 'g1', invitationId: null, value: 'veg' }] }))
		);

		expect(table[1]?.at(-2)).toBe('Vegetarisch');
	});

	test('an invitation answer lands on every person of that invitation', () => {
		const table = rows(
			toCsv(input({ answers: [{ fieldId: 'note', guestId: null, invitationId: 'inv1', value: 'Mit dem Zug' }] }))
		);

		expect(table[1]?.at(-1)).toBe('Mit dem Zug');
	});

	test('a retired field keeps its column and says so', () => {
		const table = rows(toCsv(input({ fields: [{ ...MENU, retiredAt: new Date() }] })));

		expect(table[0]?.at(-1)).toBe('Menü [zurückgezogen]');
	});

	test('semicolons, quotes and newlines cannot break a row apart', () => {
		const csv = toCsv(
			input({
				invitations: [
					{
						guests: [
							{
								ageGroup: 'child',
								email: null,
								firstName: 'Anna;Lena',
								id: 'g1',
								isMainGuest: true,
								lastName: 'von "Meier"',
								note: 'zwei\nZeilen',
								respondedAt: null,
								response: 'open',
							},
						],
						id: 'inv1',
						responseDeadline: null,
						sentAt: null,
					},
				],
			})
		);

		expect(csv).toContain('"Anna;Lena"');
		expect(csv).toContain('"von ""Meier"""');
		expect(csv).toContain('"zwei\nZeilen"');
	});

	test('checkbox answers are joined into one cell', () => {
		const table = rows(
			toCsv(
				input({
					answers: [{ fieldId: 'menu', guestId: 'g1', invitationId: null, value: ['veg', 'meat'] }],
				})
			)
		);

		expect(table[1]?.at(-2)).toBe('Vegetarisch, Fleisch');
	});

	test('the file is named after the event', () => {
		expect(toCsvFilename('Hochzeit von Anna & Ben')).toBe('hochzeit-von-anna-ben-gaesteliste.csv');
		expect(toCsvFilename('  ')).toBe('event-gaesteliste.csv');
	});
});
