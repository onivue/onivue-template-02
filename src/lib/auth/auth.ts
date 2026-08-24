import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins/magic-link';

import type { AuthEmail } from '@/lib/email/email-gateway';

import { APP_CONFIG } from '@/config';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { createResendTransport, ResendGateway } from '@/lib/email/resend-gateway';

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
	user: {
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
		nextCookies(),
	],
});

export type AuthSession = typeof auth.$Infer.Session;
