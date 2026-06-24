import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins/magic-link';

import { APP_CONFIG } from '@/config';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { AuthUrlHelper } from '@/lib/auth/auth-url-helper';
import { EmailService } from '@/lib/email/email-service';

const emailService = new EmailService();
const authUrlHelper = new AuthUrlHelper();

async function assertEmailSent(result: Awaited<ReturnType<EmailService['sendMagicLink']>>): Promise<void> {
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
	trustedOrigins: [authUrlHelper.getOrigin(APP_CONFIG.auth.baseUrl)],
	user: {
		changeEmail: {
			enabled: true,
			sendChangeEmailConfirmation: async ({ user, url }) => {
				const result = await emailService.sendChangeEmailConfirmation(user.email, url);
				await assertEmailSent(result);
			},
		},
	},
	plugins: [
		magicLink({
			expiresIn: APP_CONFIG.auth.magicLinkExpiresInSeconds,
			sendMagicLink: async ({ email, url }) => {
				const result = await emailService.sendMagicLink(email, url);
				await assertEmailSent(result);
			},
			storeToken: 'hashed',
		}),
		passkey({
			origin: authUrlHelper.getOrigin(APP_CONFIG.auth.baseUrl),
			rpID: authUrlHelper.getPasskeyRpId(APP_CONFIG.auth.baseUrl),
			rpName: APP_CONFIG.auth.passkeyRpName,
		}),
		nextCookies(),
	],
});

export type AuthSession = typeof auth.$Infer.Session;
