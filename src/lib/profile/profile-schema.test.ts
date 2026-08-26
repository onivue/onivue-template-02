import { describe, expect, test } from 'bun:test';

import {
	changePasswordFormSchema,
	firstNameSchema,
	nameFormSchema,
	newPasswordSchema,
	resetPasswordFormSchema,
	signInWithPasswordFormSchema,
	signUpWithPasswordFormSchema,
	usernameFormSchema,
	usernameSchema,
} from '@/lib/profile/profile-schema';

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

describe('the two profile forms validate independently', () => {
	test('a valid username submission passes on its own', () => {
		expect(usernameFormSchema.safeParse({ username: 'albinh' }).success).toBe(true);
	});

	test('a valid name submission passes on its own', () => {
		expect(nameFormSchema.safeParse({ firstName: 'Albin', lastName: 'Hoti' }).success).toBe(true);
	});

	test('an invalid last name does not block the username form', () => {
		expect(nameFormSchema.safeParse({ firstName: 'Albin', lastName: 'x' }).success).toBe(false);
		expect(usernameFormSchema.safeParse({ username: 'albinh' }).success).toBe(true);
	});

	test('an invalid username does not block the name form', () => {
		expect(usernameFormSchema.safeParse({ username: 'ab' }).success).toBe(false);
		expect(nameFormSchema.safeParse({ firstName: 'Albin', lastName: 'Hoti' }).success).toBe(true);
	});
});

describe('password validation', () => {
	test('a valid password is accepted', () => {
		expect(newPasswordSchema.safeParse('correct-horse-battery').success).toBe(true);
	});

	test('a too short password is rejected', () => {
		expect(newPasswordSchema.safeParse('short1').success).toBe(false);
	});

	test('a too long password is rejected', () => {
		expect(newPasswordSchema.safeParse('a'.repeat(129)).success).toBe(false);
	});
});

describe('the sign-in form', () => {
	test('a valid email and non-empty password are accepted', () => {
		expect(signInWithPasswordFormSchema.safeParse({ email: 'du@example.com', password: 'anything' }).success).toBe(
			true
		);
	});

	test('an empty password is rejected', () => {
		expect(signInWithPasswordFormSchema.safeParse({ email: 'du@example.com', password: '' }).success).toBe(false);
	});
});

describe('the sign-up form', () => {
	test('matching passwords are accepted', () => {
		const result = signUpWithPasswordFormSchema.safeParse({
			confirmPassword: 'correct-horse-battery',
			email: 'du@example.com',
			password: 'correct-horse-battery',
		});

		expect(result.success).toBe(true);
	});

	test('mismatched passwords are rejected on the confirmation field', () => {
		const result = signUpWithPasswordFormSchema.safeParse({
			confirmPassword: 'something-else',
			email: 'du@example.com',
			password: 'correct-horse-battery',
		});

		expect(result.success).toBe(false);
		expect(result.success ? null : result.error.issues[0]?.path).toEqual(['confirmPassword']);
	});
});

describe('the reset-password form', () => {
	test('mismatched passwords are rejected', () => {
		expect(
			resetPasswordFormSchema.safeParse({ confirmPassword: 'something-else', password: 'correct-horse-battery' })
				.success
		).toBe(false);
	});
});

describe('the change-password form', () => {
	test('a matching new password and confirmation are accepted', () => {
		const result = changePasswordFormSchema.safeParse({
			confirmNewPassword: 'new-correct-horse',
			currentPassword: 'old-password',
			newPassword: 'new-correct-horse',
		});

		expect(result.success).toBe(true);
	});

	test('reusing the current password as the new one is rejected', () => {
		const result = changePasswordFormSchema.safeParse({
			confirmNewPassword: 'same-password',
			currentPassword: 'same-password',
			newPassword: 'same-password',
		});

		expect(result.success).toBe(false);
	});
});
