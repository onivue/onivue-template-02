import { describe, expect, test } from 'bun:test';

import { ProfanityFilter } from '@/lib/profile/profanity-filter';

describe('profanity detection', () => {
	test('a clean value is allowed', () => {
		const filter = new ProfanityFilter(['scheisse']);

		expect(filter.containsBlockedWord('Albin')).toBe(false);
	});

	test('an exact blocked word is rejected', () => {
		const filter = new ProfanityFilter(['scheisse']);

		expect(filter.containsBlockedWord('scheisse')).toBe(true);
	});

	test('a blocked word embedded in a longer value is rejected', () => {
		const filter = new ProfanityFilter(['scheisse']);

		expect(filter.containsBlockedWord('xXscheisseXx')).toBe(true);
	});

	test('matching ignores case', () => {
		const filter = new ProfanityFilter(['scheisse']);

		expect(filter.containsBlockedWord('SCHEISSE')).toBe(true);
	});

	test('matching folds the eszett to its ss expansion', () => {
		const filter = new ProfanityFilter(['scheisse']);

		expect(filter.containsBlockedWord('Scheiße')).toBe(true);
	});

	test('matching folds common leetspeak substitutions', () => {
		const filter = new ProfanityFilter(['scheisse']);

		expect(filter.containsBlockedWord('sch3i55e')).toBe(true);
	});

	test('separators between letters do not defeat matching', () => {
		const filter = new ProfanityFilter(['fick']);

		expect(filter.containsBlockedWord('f-i.c_k')).toBe(true);
	});

	test('an empty value is never blocked', () => {
		const filter = new ProfanityFilter(['scheisse']);

		expect(filter.containsBlockedWord('')).toBe(false);
	});

	test('the default word list catches common german and english profanity', () => {
		const filter = new ProfanityFilter();

		expect(filter.containsBlockedWord('arschloch')).toBe(true);
		expect(filter.containsBlockedWord('fuck')).toBe(true);
		expect(filter.containsBlockedWord('Albin')).toBe(false);
	});
});
