// server-only: importing this from a client component fails the build instead of throwing at runtime
import 'server-only';
import { z } from 'zod';

import { deriveAuthUrls } from '@/config/auth-urls';

// a variable that is present but empty — a placeholder in .env — counts as unset rather than as a
// broken value, so an unconfigured optional feature never blocks startup
const optionalText = z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional());

const serverEnvSchema = z.object({
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	RESEND_API_KEY: z.string().min(1),
	RESEND_FROM_EMAIL: z.string().min(1),
	// object storage is optional: without it the app runs, only image upload stays switched off
	AWS_ENDPOINT_URL_S3: optionalText,
	AWS_ACCESS_KEY_ID: optionalText,
	AWS_SECRET_ACCESS_KEY: optionalText,
	AWS_REGION: optionalText,
	STORAGE_BUCKET: optionalText,
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
	// all five or none: a half-configured bucket would fail at the worst possible moment, so the
	// feature reports itself as unconfigured instead
	storage:
		serverEnv.data.AWS_ENDPOINT_URL_S3 &&
		serverEnv.data.AWS_ACCESS_KEY_ID &&
		serverEnv.data.AWS_SECRET_ACCESS_KEY &&
		serverEnv.data.AWS_REGION &&
		serverEnv.data.STORAGE_BUCKET
			? {
					accessKeyId: serverEnv.data.AWS_ACCESS_KEY_ID,
					bucket: serverEnv.data.STORAGE_BUCKET,
					endpoint: serverEnv.data.AWS_ENDPOINT_URL_S3,
					region: serverEnv.data.AWS_REGION,
					secretAccessKey: serverEnv.data.AWS_SECRET_ACCESS_KEY,
				}
			: null,
} as const;
