import { addSeconds, differenceInSeconds } from 'date-fns';

// the guest route is public, unauthenticated and writes, so it carries its own fixed-window limit.
// better-auth's rate limiter covers its own endpoints only and is deliberately not borrowed here.

export type RateLimitWindow = {
	limit: number;
	windowSeconds: number;
};

// resolving a token is cheap and happens on every page view; submitting writes and is rare
export const GUEST_RATE_LIMITS = {
	resolve: { limit: 60, windowSeconds: 60 },
	submit: { limit: 10, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitWindow>;

export type GuestRateLimitAction = keyof typeof GUEST_RATE_LIMITS;

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

// the store counts; the policy decides. `hit` resets the counter when the stored window has passed.
export type RateLimitStore = {
	hit(key: string, expiresAt: Date, now: Date): Promise<{ count: number; expiresAt: Date }>;
};

export function guestRateLimitKey(action: GuestRateLimitAction, client: string): string {
	return `guest:${action}:${client}`;
}

export class RateLimiter {
	public constructor(
		private readonly store: RateLimitStore,
		private readonly clock: () => Date
	) {}

	public async check(key: string, window: RateLimitWindow): Promise<RateLimitDecision> {
		const now = this.clock();
		const { count, expiresAt } = await this.store.hit(key, addSeconds(now, window.windowSeconds), now);

		if (count <= window.limit) {
			return { allowed: true };
		}

		return { allowed: false, retryAfterSeconds: Math.max(1, differenceInSeconds(expiresAt, now)) };
	}
}
