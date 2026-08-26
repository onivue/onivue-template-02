import { describe, expect, test } from 'bun:test';

import { ProfanityFilter, profanityFilter } from '@/lib/profile/profanity-filter';

describe('profanity detection', () => {
	test('a clean value is allowed', () => {
		expect(profanityFilter.containsBlockedWord('Albin')).toBe(false);
	});

	test('an exact blocked word is rejected', () => {
		expect(profanityFilter.containsBlockedWord('scheisse')).toBe(true);
	});

	test('a blocked word embedded in a longer value is rejected', () => {
		expect(profanityFilter.containsBlockedWord('xXscheisseXx')).toBe(true);
	});

	test('matching ignores case', () => {
		expect(profanityFilter.containsBlockedWord('SCHEISSE')).toBe(true);
	});

	test('matching folds the eszett to its ss expansion', () => {
		expect(profanityFilter.containsBlockedWord('Scheiße')).toBe(true);
	});

	test('matching folds common leetspeak substitutions', () => {
		expect(profanityFilter.containsBlockedWord('sch3i55e')).toBe(true);
	});

	test('separators between letters do not defeat matching', () => {
		expect(profanityFilter.containsBlockedWord('f-i.c_k')).toBe(true);
	});

	test('an empty value is never blocked', () => {
		expect(profanityFilter.containsBlockedWord('')).toBe(false);
	});
});

describe('the shipped dictionaries', () => {
	test('german profanity is caught', () => {
		expect(profanityFilter.containsBlockedWord('arschloch')).toBe(true);
		expect(profanityFilter.containsBlockedWord('wichser')).toBe(true);
	});

	test('english profanity is caught', () => {
		expect(profanityFilter.containsBlockedWord('fuck')).toBe(true);
		expect(profanityFilter.containsBlockedWord('bitch')).toBe(true);
	});

	test('slurs the package dictionary misses are still caught', () => {
		expect(profanityFilter.containsBlockedWord('hurensohn')).toBe(true);
		expect(profanityFilter.containsBlockedWord('neger')).toBe(true);
		expect(profanityFilter.containsBlockedWord('untermensch')).toBe(true);
	});
});

// the german dictionary is machine-translated, so ordinary words in it would reject real people
describe('real names are not mistaken for profanity', () => {
	const names = ['Müller', 'Meier', 'Kummer', 'Lustig', 'Kümmel', 'Assmann', 'Dickmann', 'Kassandra', 'Diesel'];

	for (const name of names) {
		test(`${name} is allowed`, () => {
			expect(profanityFilter.containsBlockedWord(name)).toBe(false);
		});
	}
});

describe('additional words', () => {
	test('a custom word is blocked on top of the dictionaries', () => {
		const filter = new ProfanityFilter(['onivue']);

		expect(filter.containsBlockedWord('onivue')).toBe(true);
		expect(filter.containsBlockedWord('fuck')).toBe(true);
		expect(filter.containsBlockedWord('Albin')).toBe(false);
	});
});
