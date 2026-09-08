import 'server-only';
import type { Query } from 'drizzle-orm';

import { subDays } from 'date-fns';
import { and, eq, isNull, lt, notExists, or, sql } from 'drizzle-orm';

import type { db } from '@/db/client';

import {
	guestRateLimit,
	oauthAccessToken,
	oauthClient,
	oauthConsent,
	oauthRefreshToken,
	session,
	verification,
} from '@/db/schema';

// better-auth prunes none of its own tables — its schema note says the rows "accumulate until a
// deployment-level sweep removes them". this is that sweep, run from a cron route.
//
// two rules shape every predicate below. deletes cascade along the oauth foreign keys, so a row
// something live still points at must be unreachable rather than merely unlikely; and nothing is
// swept the moment it expires, because a registration waiting for its consent screen and a rate
// limit someone is about to ask about both look like garbage for a while first.

export type Database = typeof db;

export type SweepReport = Record<string, number>;

export type SweepResult = { data: SweepReport; success: true } | { error: string; success: false };

// a returning() delete, before it is awaited: the tests read the sql, the sweeper counts the rows
type PendingDelete = PromiseLike<unknown[]> & { toSQL: () => Query };

export type Sweep = {
	build: (database: Database, now: Date) => PendingDelete;
	name: string;
};

// a client registers first and the person consents afterwards — sometimes after reading the screen
// twice. anything younger than this is still a flow in progress, not litter.
const CLIENT_GRACE_DAYS = 1;

// keeping a day of dead rows past their expiry is what makes yesterday's incident diagnosable
const EXPIRED_GRACE_DAYS = 1;

function expiredBefore(now: Date): Date {
	return subDays(now, EXPIRED_GRACE_DAYS);
}

// a rotated refresh token stays behind to catch a replay of the one it replaced;
// rotation_replay_expires_at says when that watch is over. deleting one early blinds the check.
function prunableRefreshToken(cutoff: Date) {
	return and(
		or(lt(oauthRefreshToken.expiresAt, cutoff), lt(oauthRefreshToken.revoked, cutoff)),
		or(isNull(oauthRefreshToken.rotationReplayExpiresAt), lt(oauthRefreshToken.rotationReplayExpiresAt, cutoff))
	);
}

const SWEEPS: Sweep[] = [
	{
		build: (database, now) =>
			database
				.delete(oauthRefreshToken)
				.where(prunableRefreshToken(expiredBefore(now)))
				.returning({ id: oauthRefreshToken.id }),
		name: 'oauth_refresh_token',
	},
	{
		build: (database, now) =>
			database
				.delete(oauthAccessToken)
				.where(
					or(
						lt(oauthAccessToken.expiresAt, expiredBefore(now)),
						lt(oauthAccessToken.revoked, expiredBefore(now))
					)
				)
				.returning({ id: oauthAccessToken.id }),
		name: 'oauth_access_token',
	},
	{
		// an oauth token names the session that created it and cascades from it, and an
		// offline_access refresh token is meant to outlive the browser session — so an expired
		// session that still carries one is left alone rather than taking the agent's access with it
		build: (database, now) =>
			database
				.delete(session)
				.where(
					and(
						lt(session.expiresAt, expiredBefore(now)),
						notExists(
							database
								.select({ one: sql`1` })
								.from(oauthRefreshToken)
								.where(eq(oauthRefreshToken.sessionId, session.id))
						),
						notExists(
							database
								.select({ one: sql`1` })
								.from(oauthAccessToken)
								.where(eq(oauthAccessToken.sessionId, session.id))
						)
					)
				)
				.returning({ id: session.id }),
		name: 'session',
	},
	{
		// deleting a client cascades to its consents and tokens, so this predicate is negative on
		// purpose: whatever a person or a live token still points at is out of reach. a row with no
		// created_at is never old enough to match, which is the safe direction to fail in.
		build: (database, now) =>
			database
				.delete(oauthClient)
				.where(
					and(
						lt(oauthClient.createdAt, subDays(now, CLIENT_GRACE_DAYS)),
						notExists(
							database
								.select({ one: sql`1` })
								.from(oauthConsent)
								.where(eq(oauthConsent.clientId, oauthClient.clientId))
						),
						notExists(
							database
								.select({ one: sql`1` })
								.from(oauthAccessToken)
								.where(eq(oauthAccessToken.clientId, oauthClient.clientId))
						),
						notExists(
							database
								.select({ one: sql`1` })
								.from(oauthRefreshToken)
								.where(eq(oauthRefreshToken.clientId, oauthClient.clientId))
						)
					)
				)
				.returning({ id: oauthClient.id }),
		name: 'oauth_client',
	},
	{
		build: (database, now) =>
			database
				.delete(verification)
				.where(lt(verification.expiresAt, expiredBefore(now)))
				.returning({ id: verification.id }),
		name: 'verification',
	},
	{
		build: (database, now) =>
			database
				.delete(guestRateLimit)
				.where(lt(guestRateLimit.expiresAt, expiredBefore(now)))
				.returning({ key: guestRateLimit.key }),
		name: 'guest_rate_limit',
	},
];

export function sweepPlan(): readonly Sweep[] {
	return SWEEPS;
}

export class DatabaseSweeper {
	public constructor(
		private readonly database: Database,
		private readonly clock: () => Date = () => new Date()
	) {}

	// in order, because each step frees the next: dropping dead tokens is what turns their session
	// and their client into orphans the later steps may take
	public async sweep(): Promise<SweepResult> {
		const now = this.clock();
		const report: SweepReport = {};

		try {
			for (const { build, name } of SWEEPS) {
				const rows = await build(this.database, now);

				report[name] = rows.length;
			}
		} catch (error) {
			return { error: error instanceof Error ? error.message : 'Der Sweep ist fehlgeschlagen.', success: false };
		}

		return { data: report, success: true };
	}
}
