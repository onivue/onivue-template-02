import { z } from 'zod';

import { profanityFilter } from '@/lib/profile/profanity-filter';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 40;

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

export const profileFormSchema = z.object({
	username: usernameSchema,
	firstName: firstNameSchema,
	lastName: lastNameSchema,
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// declared once, so the server (auth.ts) and client (auth-client.ts) additional-fields config never drift apart
export const PROFILE_ADDITIONAL_FIELDS = {
	firstName: { type: 'string', required: false, input: true },
	lastName: { type: 'string', required: false, input: true },
} as const;
