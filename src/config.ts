import { z } from 'zod';

const serverEnvSchema = z.object({
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	RESEND_API_KEY: z.string().min(1),
	RESEND_FROM_EMAIL: z.string().min(1),
});

const LOOPBACK_HOSTNAME = '127.0.0.1';
const LOOPBACK_RP_ID = 'localhost';

export type AuthUrls = {
	origin: string;
	passkeyRpId: string;
};

// derived once from the validated base url, rather than recomputed per call site
export function deriveAuthUrls(baseUrl: string): AuthUrls {
	const { hostname, origin } = new URL(baseUrl);

	return {
		origin,
		passkeyRpId: hostname === LOOPBACK_HOSTNAME ? LOOPBACK_RP_ID : hostname,
	};
}

const serverEnv = serverEnvSchema.safeParse(process.env);

if (!serverEnv.success) {
	const errors = z.treeifyError(serverEnv.error);
	throw new Error(`Invalid server environment: ${JSON.stringify(errors.properties)}`);
}

const authUrls = deriveAuthUrls(serverEnv.data.BETTER_AUTH_URL);

export const APP_CONFIG = {
	app: {
		name: 'onivue',
	},
	auth: {
		baseUrl: serverEnv.data.BETTER_AUTH_URL,
		magicLinkExpiresInSeconds: 900,
		origin: authUrls.origin,
		passkeyRpId: authUrls.passkeyRpId,
		passkeyRpName: 'onivue',
		resetPasswordExpiresInSeconds: 1800,
		secret: serverEnv.data.BETTER_AUTH_SECRET,
	},
	env: {
		DATABASE_URL: serverEnv.data.DATABASE_URL,
	},
	mail: {
		from: serverEnv.data.RESEND_FROM_EMAIL,
		resendApiKey: serverEnv.data.RESEND_API_KEY,
	},
} as const;
