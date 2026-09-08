import { neon } from '@neondatabase/serverless';
import { describe, expect, test } from 'bun:test';
import { drizzle } from 'drizzle-orm/neon-http';

import type { Database } from '@/lib/maintenance/database-sweeper';

import * as schema from '@/db/schema';
import { sweepPlan } from '@/lib/maintenance/database-sweeper';

// the statements are built and read, never sent: this connection is a shape, not a database
const database: Database = drizzle(neon('postgresql://sweeper:none@localhost/none'), { schema });

const NOW = new Date('2026-09-08T04:00:00.000Z');

function sqlFor(name: string): string {
	const sweep = sweepPlan().find((candidate) => candidate.name === name);

	if (!sweep) {
		throw new Error(`no sweep named ${name}`);
	}

	return sweep.build(database, NOW).toSQL().sql;
}

// deleting an oauth_client cascades to its consents and tokens, so a dropped guard here does not
// fail loudly — it quietly disconnects a live client. each guard gets its own assertion.
describe('the client sweep cannot reach a live registration', () => {
	test.each(['oauth_consent', 'oauth_access_token', 'oauth_refresh_token'])(
		'a client with a row in %s is out of reach',
		(guarded) => {
			expect(sqlFor('oauth_client')).toContain(guarded);
		}
	);

	test('it skips clients that are younger than the grace period', () => {
		expect(sqlFor('oauth_client')).toContain('"created_at" <');
	});
});

// an offline_access refresh token is meant to outlive the browser session it was issued in, and it
// cascades from that session row
describe('the session sweep cannot take an agent offline', () => {
	test.each(['oauth_refresh_token', 'oauth_access_token'])(
		'a session still holding a %s is left alone',
		(guarded) => {
			expect(sqlFor('session')).toContain(guarded);
		}
	);
});

describe('the refresh token sweep keeps the replay watch intact', () => {
	test('a token whose rotation replay window is still open is left alone', () => {
		expect(sqlFor('oauth_refresh_token')).toContain('rotation_replay_expires_at');
	});

	test('revoked tokens are swept as well as expired ones', () => {
		expect(sqlFor('oauth_refresh_token')).toContain('"revoked" <');
	});
});

describe('every sweep is bounded', () => {
	test.each(sweepPlan().map((sweep) => sweep.name))('%s deletes with a where clause and reports its rows', (name) => {
		const statement = sqlFor(name);

		expect(statement).toStartWith('delete from');
		expect(statement).toContain(' where ');
		expect(statement).toContain(' returning ');
	});
});
