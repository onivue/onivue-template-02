import { z } from 'zod';

const serverEnvSchema = z.object({
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	RESEND_API_KEY: z.string().min(1),
	RESEND_FROM_EMAIL: z.string().min(1),
});

const serverEnv = serverEnvSchema.safeParse(process.env);

if (!serverEnv.success) {
	const errors = z.treeifyError(serverEnv.error);
	throw new Error(`Invalid server environment: ${JSON.stringify(errors.properties)}`);
}

export const APP_CONFIG = {
	app: {
		name: 'onivue',
	},
	auth: {
		baseUrl: serverEnv.data.BETTER_AUTH_URL,
		magicLinkExpiresInSeconds: 900,
		passkeyRpName: 'onivue',
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
