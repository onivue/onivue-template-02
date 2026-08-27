import { plugin } from 'bun';

// config/env validates and throws at import time, so tests need a plausible env before any import
process.env.DATABASE_URL ??= 'postgres://user:pass@localhost:5432/onivue_test';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-value-that-is-long-enough';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
process.env.RESEND_API_KEY ??= 'test-resend-key';
process.env.RESEND_FROM_EMAIL ??= 'onivue@example.com';

// next resolves server-only to an empty module on the server; bun has no such condition, so stub it
plugin({
	name: 'server-only-stub',
	setup(build) {
		build.module('server-only', () => ({ contents: 'export {};', loader: 'js' }));
	},
});
