import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

// drizzle-kit runs outside next, where the server-only config module cannot be imported
const databaseUrl = z.string().min(1).parse(process.env.DATABASE_URL);

export default defineConfig({
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl,
	},
	out: './drizzle',
	schema: './src/db/schema.ts',
});
