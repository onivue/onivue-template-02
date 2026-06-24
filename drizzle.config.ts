import { defineConfig } from 'drizzle-kit';

import { APP_CONFIG } from '@/config';

export default defineConfig({
	dialect: 'postgresql',
	dbCredentials: {
		url: APP_CONFIG.env.DATABASE_URL,
	},
	out: './drizzle',
	schema: './src/db/schema.ts',
});
