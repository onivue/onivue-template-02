import { describe, expect, test } from 'bun:test';

import { firstNameSchema, profileFormSchema, usernameSchema } from '@/lib/profile/profile-schema';

describe('username validation', () => {
	test('a valid username is accepted', () => {
		expect(usernameSchema.safeParse('albin_h.01').success).toBe(true);
	});

	test('a too short username is rejected', () => {
		expect(usernameSchema.safeParse('ab').success).toBe(false);
	});

	test('a too long username is rejected', () => {
		expect(usernameSchema.safeParse('a'.repeat(31)).success).toBe(false);
	});

	test('spaces and other special characters are rejected', () => {
		expect(usernameSchema.safeParse('albin hoti').success).toBe(false);
		expect(usernameSchema.safeParse('albin@hoti').success).toBe(false);
	});

	test('a blocked word is rejected', () => {
		expect(usernameSchema.safeParse('scheisse').success).toBe(false);
	});

	test('surrounding whitespace is trimmed before validation', () => {
		const result = usernameSchema.safeParse('  albin  ');

		expect(result.success).toBe(true);
		expect(result.success ? result.data : null).toBe('albin');
	});
});

describe('name validation', () => {
	test('a valid first name is accepted', () => {
		expect(firstNameSchema.safeParse('Albin').success).toBe(true);
	});

	test('umlauts and accents are accepted', () => {
		expect(firstNameSchema.safeParse('Jörg').success).toBe(true);
	});

	test('hyphenated and apostrophised names are accepted', () => {
		expect(firstNameSchema.safeParse("Anne-Marie O'Connor").success).toBe(true);
	});

	test('a single character is rejected', () => {
		expect(firstNameSchema.safeParse('A').success).toBe(false);
	});

	test('digits are rejected', () => {
		expect(firstNameSchema.safeParse('Albin1').success).toBe(false);
	});

	test('a blocked word is rejected', () => {
		expect(firstNameSchema.safeParse('Hurensohn').success).toBe(false);
	});
});

describe('the combined profile form', () => {
	test('a fully valid submission passes', () => {
		const result = profileFormSchema.safeParse({
			username: 'albinh',
			firstName: 'Albin',
			lastName: 'Hoti',
		});

		expect(result.success).toBe(true);
	});

	test('a single invalid field fails the whole submission', () => {
		const result = profileFormSchema.safeParse({
			username: 'albinh',
			firstName: 'Albin',
			lastName: 'x',
		});

		expect(result.success).toBe(false);
	});
});
