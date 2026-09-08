import { neon } from '@neondatabase/serverless';
import { describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

import { eventInvitation } from '@/db/schema';
import { VIEW_INCREMENT } from '@/lib/events/invitation-repository';

// builds the statement without sending it: toSQL renders, it does not connect
const database = drizzle(neon('postgresql://user:pw@example.neon.tech/db'));

describe('recording an invitation view', () => {
	test('increments inside the statement rather than reading and writing back', () => {
		const { sql } = database
			.update(eventInvitation)
			.set({ viewCount: VIEW_INCREMENT })
			.where(eq(eventInvitation.token, 'tok'))
			.toSQL();

		expect(sql).toContain('"view_count" = "event_invitation"."view_count" + 1');
	});
});
