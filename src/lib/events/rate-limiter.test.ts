import { describe, expect, test } from 'bun:test';

import { guestRateLimitKey, RateLimiter, type RateLimitStore } from '@/lib/events/rate-limiter';

const NOW = new Date('2026-03-01T12:00:00Z');
const WINDOW = { limit: 3, windowSeconds: 60 };

// stands in for the upsert: it counts within a window and starts over once that window has passed
function createStore(): RateLimitStore {
	const windows = new Map<string, { count: number; expiresAt: Date }>();

	return {
		hit: async (key, expiresAt, now) => {
			const current = windows.get(key);
			const next =
				!current || current.expiresAt <= now
					? { count: 1, expiresAt }
					: { count: current.count + 1, expiresAt: current.expiresAt };

			windows.set(key, next);

			return next;
		},
	};
}

describe('the guest rate limit', () => {
	test('requests up to the limit are allowed', async () => {
		const limiter = new RateLimiter(createStore(), () => NOW);

		expect(await limiter.check('k', WINDOW)).toEqual({ allowed: true });
		expect(await limiter.check('k', WINDOW)).toEqual({ allowed: true });
		expect(await limiter.check('k', WINDOW)).toEqual({ allowed: true });
	});

	test('the request past the limit is refused and says when to come back', async () => {
		const limiter = new RateLimiter(createStore(), () => NOW);

		await limiter.check('k', WINDOW);
		await limiter.check('k', WINDOW);
		await limiter.check('k', WINDOW);

		expect(await limiter.check('k', WINDOW)).toEqual({ allowed: false, retryAfterSeconds: 60 });
	});

	test('separate keys hold separate budgets', async () => {
		const store = createStore();
		const limiter = new RateLimiter(store, () => NOW);

		await limiter.check('a', { limit: 1, windowSeconds: 60 });

		expect(await limiter.check('a', { limit: 1, windowSeconds: 60 })).toMatchObject({ allowed: false });
		expect(await limiter.check('b', { limit: 1, windowSeconds: 60 })).toEqual({ allowed: true });
	});

	test('a new window starts once the old one has passed', async () => {
		const store = createStore();
		let now = NOW;
		const limiter = new RateLimiter(store, () => now);

		await limiter.check('k', { limit: 1, windowSeconds: 60 });
		expect(await limiter.check('k', { limit: 1, windowSeconds: 60 })).toMatchObject({ allowed: false });

		now = new Date('2026-03-01T12:02:00Z');

		expect(await limiter.check('k', { limit: 1, windowSeconds: 60 })).toEqual({ allowed: true });
	});

	test('keys name the action and the client, so one cannot spend the other budget', () => {
		expect(guestRateLimitKey('submit', '203.0.113.7')).toBe('guest:submit:203.0.113.7');
		expect(guestRateLimitKey('resolve', '203.0.113.7')).not.toBe(guestRateLimitKey('submit', '203.0.113.7'));
	});
});
