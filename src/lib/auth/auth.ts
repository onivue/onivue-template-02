import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { passkey } from '@better-auth/passkey';
import { APIError, betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins/magic-link';
import { username } from 'better-auth/plugins/username';

import type { AuthEmail } from '@/lib/email/email-gateway';

import { APP_CONFIG } from '@/config';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { createResendTransport, ResendGateway } from '@/lib/email/resend-gateway';
import { profanityFilter } from '@/lib/profile/profanity-filter';
import {
	firstNameSchema,
	lastNameSchema,
	PROFILE_ADDITIONAL_FIELDS,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_PATTERN,
} from '@/lib/profile/profile-schema';

// the one wiring point where config meets the transport
const emailGateway = new ResendGateway({
	from: APP_CONFIG.mail.from,
	transport: createResendTransport(APP_CONFIG.mail.resendApiKey),
});

async function sendAuthEmail(message: AuthEmail): Promise<void> {
	const result = await emailGateway.send(message);

	if (result.success) {
		return;
	}

	throw new Error(result.error.message);
}

// firstName/lastName have no dedicated better-auth plugin, so profile validation lives here
function rejectInvalidProfileFields(user: Record<string, unknown>): void {
	if (typeof user.firstName === 'string') {
		const result = firstNameSchema.safeParse(user.firstName);

		if (!result.success) {
			throw new APIError('BAD_REQUEST', {
				code: 'INVALID_FIRST_NAME',
				message: result.error.issues[0]?.message ?? 'Der Vorname ist ungültig.',
			});
		}
	}

	if (typeof user.lastName === 'string') {
		const result = lastNameSchema.safeParse(user.lastName);

		if (!result.success) {
			throw new APIError('BAD_REQUEST', {
				code: 'INVALID_LAST_NAME',
				message: result.error.issues[0]?.message ?? 'Der Nachname ist ungültig.',
			});
		}
	}
}

export const auth = betterAuth({
	appName: APP_CONFIG.app.name,
	baseURL: APP_CONFIG.auth.baseUrl,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema,
	}),
	rateLimit: {
		enabled: true,
		max: 10,
		storage: 'database',
		window: 60,
	},
	secret: APP_CONFIG.auth.secret,
	trustedOrigins: [APP_CONFIG.auth.origin],
	databaseHooks: {
		user: {
			update: {
				before: async (user) => {
					rejectInvalidProfileFields(user);
				},
			},
		},
	},
	user: {
		additionalFields: PROFILE_ADDITIONAL_FIELDS,
		changeEmail: {
			enabled: true,
			sendChangeEmailConfirmation: async ({ user, url }) => {
				await sendAuthEmail({ kind: 'email-change', to: user.email, url });
			},
		},
	},
	plugins: [
		magicLink({
			expiresIn: APP_CONFIG.auth.magicLinkExpiresInSeconds,
			sendMagicLink: async ({ email, url }) => {
				await sendAuthEmail({ kind: 'magic-link', to: email, url });
			},
			storeToken: 'hashed',
		}),
		passkey({
			origin: APP_CONFIG.auth.origin,
			rpID: APP_CONFIG.auth.passkeyRpId,
			rpName: APP_CONFIG.auth.passkeyRpName,
		}),
		username({
			displayUsername: false,
			minUsernameLength: USERNAME_MIN_LENGTH,
			maxUsernameLength: USERNAME_MAX_LENGTH,
			usernameValidator: (candidate) =>
				USERNAME_PATTERN.test(candidate) && !profanityFilter.containsBlockedWord(candidate),
		}),
		nextCookies(),
	],
});

export type AuthSession = typeof auth.$Infer.Session;
