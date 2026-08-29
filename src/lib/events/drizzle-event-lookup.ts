import { and, eq } from 'drizzle-orm';

import type { db } from '@/db/client';
import type { EventLookup, EventSummary } from '@/lib/events/event-access';

import { event } from '@/db/schema';

// the only place an event is fetched by id. the organization is part of the query rather than a
// check afterwards, so there is no version of this that can forget it.
export class DrizzleEventLookup implements EventLookup {
	public constructor(private readonly database: typeof db) {}

	public async findEvent(eventId: string, organizationId: string): Promise<EventSummary | null> {
		const [row] = await this.database
			.select({
				id: event.id,
				organizationId: event.organizationId,
				status: event.status,
				title: event.title,
			})
			.from(event)
			.where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)))
			.limit(1);

		return row ?? null;
	}
}
