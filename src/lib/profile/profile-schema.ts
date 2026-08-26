import { z } from 'zod';

import { profanityFilter } from '@/lib/profile/profanity-filter';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 40;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// mirrors better-auth's own username plugin default pattern
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;
// letters (incl. accented/umlaut), spaces, hyphens and apostrophes only
const NAME_PATTERN = /^[\p{L}][\p{L}'’.\- ]*$/u;

const USERNAME_TOO_SHORT_MESSAGE = `Der Benutzername muss mindestens ${USERNAME_MIN_LENGTH} Zeichen lang sein.`;
const USERNAME_TOO_LONG_MESSAGE = `Der Benutzername darf höchstens ${USERNAME_MAX_LENGTH} Zeichen lang sein.`;
const USERNAME_PATTERN_MESSAGE = 'Nur Buchstaben, Zahlen, Punkt und Unterstrich sind erlaubt.';
const USERNAME_BLOCKED_MESSAGE = 'Dieser Benutzername ist nicht erlaubt.';

export const usernameSchema = z
	.string()
	.trim()
	.min(USERNAME_MIN_LENGTH, USERNAME_TOO_SHORT_MESSAGE)
	.max(USERNAME_MAX_LENGTH, USERNAME_TOO_LONG_MESSAGE)
	.regex(USERNAME_PATTERN, USERNAME_PATTERN_MESSAGE)
	.refine((value) => !profanityFilter.containsBlockedWord(value), USERNAME_BLOCKED_MESSAGE);

function nameSchema(label: string) {
	return z
		.string()
		.trim()
		.min(NAME_MIN_LENGTH, `${label} muss mindestens ${NAME_MIN_LENGTH} Zeichen lang sein.`)
		.max(NAME_MAX_LENGTH, `${label} darf höchstens ${NAME_MAX_LENGTH} Zeichen lang sein.`)
		.regex(NAME_PATTERN, `${label} darf nur Buchstaben, Leerzeichen, Bindestriche und Apostrophe enthalten.`)
		.refine((value) => !profanityFilter.containsBlockedWord(value), `${label} enthält ein unangemessenes Wort.`);
}

export const firstNameSchema = nameSchema('Der Vorname');
export const lastNameSchema = nameSchema('Der Nachname');

// the username is saved on its own, so it never blocks on an invalid first or last name
export const usernameFormSchema = z.object({
	username: usernameSchema,
});

export const nameFormSchema = z.object({
	firstName: firstNameSchema,
	lastName: lastNameSchema,
});

export type UsernameFormValues = z.infer<typeof usernameFormSchema>;
export type NameFormValues = z.infer<typeof nameFormSchema>;

export const emailSchema = z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.');

const PASSWORD_TOO_SHORT_MESSAGE = `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`;
const PASSWORD_TOO_LONG_MESSAGE = `Das Passwort darf höchstens ${PASSWORD_MAX_LENGTH} Zeichen lang sein.`;
const PASSWORD_REQUIRED_MESSAGE = 'Bitte gib dein Passwort ein.';
const PASSWORDS_DO_NOT_MATCH_MESSAGE = 'Die Passwörter stimmen nicht überein.';
const NEW_PASSWORD_MUST_DIFFER_MESSAGE = 'Das neue Passwort muss sich vom aktuellen unterscheiden.';

// enforced again on submit; the server (auth.ts) validates the same bounds
export const newPasswordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, PASSWORD_TOO_SHORT_MESSAGE)
	.max(PASSWORD_MAX_LENGTH, PASSWORD_TOO_LONG_MESSAGE);

// sign-in only checks presence: the stored hash is what actually gets verified
export const currentPasswordSchema = z.string().min(1, PASSWORD_REQUIRED_MESSAGE);

export const signUpWithPasswordFormSchema = z
	.object({
		confirmPassword: z.string(),
		email: emailSchema,
		password: newPasswordSchema,
	})
	.refine((values) => values.password === values.confirmPassword, {
		message: PASSWORDS_DO_NOT_MATCH_MESSAGE,
		path: ['confirmPassword'],
	});

export const signInWithPasswordFormSchema = z.object({
	email: emailSchema,
	password: currentPasswordSchema,
});

export const forgotPasswordFormSchema = z.object({
	email: emailSchema,
});

export const resetPasswordFormSchema = z
	.object({
		confirmPassword: z.string(),
		password: newPasswordSchema,
	})
	.refine((values) => values.password === values.confirmPassword, {
		message: PASSWORDS_DO_NOT_MATCH_MESSAGE,
		path: ['confirmPassword'],
	});

export const changePasswordFormSchema = z
	.object({
		confirmNewPassword: z.string(),
		currentPassword: currentPasswordSchema,
		newPassword: newPasswordSchema,
	})
	.refine((values) => values.newPassword === values.confirmNewPassword, {
		message: PASSWORDS_DO_NOT_MATCH_MESSAGE,
		path: ['confirmNewPassword'],
	})
	.refine((values) => values.currentPassword !== values.newPassword, {
		message: NEW_PASSWORD_MUST_DIFFER_MESSAGE,
		path: ['newPassword'],
	});

export type SignUpWithPasswordFormValues = z.infer<typeof signUpWithPasswordFormSchema>;
export type SignInWithPasswordFormValues = z.infer<typeof signInWithPasswordFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

// declared once, so the server (auth.ts) and client (auth-client.ts) additional-fields config never drift apart
export const PROFILE_ADDITIONAL_FIELDS = {
	firstName: { type: 'string', required: false, input: true },
	lastName: { type: 'string', required: false, input: true },
} as const;
