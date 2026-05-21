import { z } from 'zod';

const serverEnvSchema = z.object({
	DATABASE_URL: z.string().min(1),
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
	env: {
		DATABASE_URL: serverEnv.data.DATABASE_URL,
	},
} as const;
