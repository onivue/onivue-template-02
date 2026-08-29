import { describe, expect, test } from 'bun:test';

import { parseGuestList } from '@/lib/events/guest-list-parser';

describe('parsing a pasted guest list', () => {
	test('one line is one invitation, the first person is the main guest', () => {
		const { invitations, issues } = parseGuestList('Anna Meier, Ben Meier\nOma');

		expect(issues).toEqual([]);
		expect(invitations).toEqual([
			{
				guests: [
					{ firstName: 'Anna', lastName: 'Meier' },
					{ firstName: 'Ben', lastName: 'Meier' },
				],
				line: 1,
			},
			{ guests: [{ firstName: 'Oma', lastName: null }], line: 2 },
		]);
	});

	test('everything after the first word is the last name', () => {
		const { invitations } = parseGuestList('Anna von der Heide');

		expect(invitations[0]?.guests[0]).toEqual({ firstName: 'Anna', lastName: 'von der Heide' });
	});

	test('blank lines and stray whitespace are ignored', () => {
		const { invitations, issues } = parseGuestList('\n   \n  Anna Meier  ,  Ben Meier \n\n');

		expect(issues).toEqual([]);
		expect(invitations).toHaveLength(1);
		expect(invitations[0]?.line).toBe(3);
	});

	test('a missing name between two commas is reported with its line', () => {
		const { invitations, issues } = parseGuestList('Anna Meier\nBen,,Cara');

		expect(invitations).toHaveLength(1);
		expect(issues).toEqual([{ line: 2, message: 'Zwischen zwei Kommas fehlt ein Name.', text: 'Ben,,Cara' }]);
	});

	test('a line without any name is reported rather than silently dropped', () => {
		const { issues } = parseGuestList(',,,');

		expect(issues[0]?.message).toBe('Hier steht kein Name.');
	});

	test('an absurdly large party is refused', () => {
		const line = Array.from({ length: 21 }, (_, index) => `Gast${index}`).join(', ');

		expect(parseGuestList(line).issues[0]?.message).toContain('20 Personen');
	});

	test('an absurdly long paste stops at the limit', () => {
		const { invitations, issues } = parseGuestList(Array.from({ length: 502 }, (_, i) => `Gast${i}`).join('\n'));

		expect(invitations).toHaveLength(500);
		expect(issues[0]?.message).toContain('500 Einladungen');
	});
});
