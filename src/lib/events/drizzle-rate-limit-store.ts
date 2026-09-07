import { sql } from 'drizzle-orm';

import type { db } from '@/db/client';
import type { RateLimitStore } from '@/lib/events/rate-limiter';

import { guestRateLimit } from '@/db/schema';

// counting happens in one statement, so two requests arriving together cannot both read the same
// count and both decide they are the first
export class DrizzleRateLimitStore implements RateLimitStore {
	public constructor(private readonly database: typeof db) {}

	public async hit(key: string, expiresAt: Date, now: Date): Promise<{ count: number; expiresAt: Date }> {
		const expired = sql`${guestRateLimit.expiresAt} <= ${now}`;

		const [row] = await this.database
			.insert(guestRateLimit)
			.values({ count: 1, expiresAt, key })
			.onConflictDoUpdate({
				set: {
					// a window that has run out starts over instead of carrying its old count forward
					count: sql`case when ${expired} then 1 else ${guestRateLimit.count} + 1 end`,
					expiresAt: sql`case when ${expired} then ${expiresAt} else ${guestRateLimit.expiresAt} end`,
				},
				target: guestRateLimit.key,
			})
			.returning({ count: guestRateLimit.count, expiresAt: guestRateLimit.expiresAt });

		return row ?? { count: 1, expiresAt };
	}
}
