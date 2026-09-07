// server-only: importing this from a client component fails the build instead of throwing at runtime
import 'server-only';
import { z } from 'zod';

import { deriveAuthUrls } from '@/config/auth-urls';

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

const authUrls = deriveAuthUrls(serverEnv.data.BETTER_AUTH_URL);

export const SERVER_CONFIG = {
	auth: {
		baseUrl: serverEnv.data.BETTER_AUTH_URL,
		origin: authUrls.origin,
		passkeyRpId: authUrls.passkeyRpId,
		secret: serverEnv.data.BETTER_AUTH_SECRET,
	},
	database: {
		url: serverEnv.data.DATABASE_URL,
	},
	mail: {
		from: serverEnv.data.RESEND_FROM_EMAIL,
		resendApiKey: serverEnv.data.RESEND_API_KEY,
	},
} as const;
