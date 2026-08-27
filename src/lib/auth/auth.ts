import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { mcp } from '@better-auth/mcp';
import { passkey } from '@better-auth/passkey';
import { APIError, betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { jwt } from 'better-auth/plugins/jwt';
import { magicLink } from 'better-auth/plugins/magic-link';
import { username } from 'better-auth/plugins/username';

import type { AuthEmail } from '@/lib/email/email-gateway';

import { APP_CONFIG } from '@/config/app';
import { SERVER_CONFIG } from '@/config/env';
import { APP_ROUTES } from '@/config/routes';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { createResendTransport, ResendGateway } from '@/lib/email/resend-gateway';
import { getMcpEndpointUrl } from '@/lib/mcp/mcp-config';
import { MCP_SCOPES } from '@/lib/mcp/mcp-scopes';
import { profanityFilter } from '@/lib/profile/profanity-filter';
import {
	firstNameSchema,
	lastNameSchema,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	PROFILE_ADDITIONAL_FIELDS,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_PATTERN,
} from '@/lib/profile/profile-schema';

// the one wiring point where config meets the transport
const emailGateway = new ResendGateway({
	from: SERVER_CONFIG.mail.from,
	transport: createResendTransport(SERVER_CONFIG.mail.resendApiKey),
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
	baseURL: SERVER_CONFIG.auth.baseUrl,
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
	secret: SERVER_CONFIG.auth.secret,
	trustedOrigins: [SERVER_CONFIG.auth.origin],
	emailAndPassword: {
		enabled: true,
		maxPasswordLength: PASSWORD_MAX_LENGTH,
		minPasswordLength: PASSWORD_MIN_LENGTH,
		requireEmailVerification: true,
		resetPasswordTokenExpiresIn: APP_CONFIG.auth.resetPasswordExpiresInSeconds,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			await sendAuthEmail({ kind: 'password-reset', to: user.email, url });
		},
	},
	emailVerification: {
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendAuthEmail({ kind: 'email-verification', to: user.email, url });
		},
	},
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
			origin: SERVER_CONFIG.auth.origin,
			rpID: SERVER_CONFIG.auth.passkeyRpId,
			rpName: APP_CONFIG.auth.passkeyRpName,
		}),
		username({
			displayUsername: false,
			minUsernameLength: USERNAME_MIN_LENGTH,
			maxUsernameLength: USERNAME_MAX_LENGTH,
			usernameValidator: (candidate) =>
				USERNAME_PATTERN.test(candidate) && !profanityFilter.containsBlockedWord(candidate),
		}),
		// signs the access tokens that mcp() issues; requireMcpAuth verifies them against /jwks
		jwt(),
		// the OAuth 2.1 authorization server for MCP clients: serves discovery metadata, runs
		// authorization_code + PKCE, and audience-binds issued tokens to the MCP endpoint
		mcp({
			consentPage: APP_ROUTES.CONSENT,
			loginPage: APP_ROUTES.LOGIN,
			resource: getMcpEndpointUrl(),
			scopes: [...MCP_SCOPES],
			// MCP clients are not pre-registered, so they register themselves at /oauth2/register
			// and are then gated by the user's explicit consent, not by an allow-list
			allowDynamicClientRegistration: true,
			allowUnauthenticatedClientRegistration: true,
		}),
		nextCookies(),
	],
});

export type AuthSession = typeof auth.$Infer.Session;
