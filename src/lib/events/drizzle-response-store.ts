import type { BatchItem } from 'drizzle-orm/batch';

import { and, eq, isNull, sql } from 'drizzle-orm';

import type { db } from '@/db/client';
import type { ResponsePlan } from '@/lib/events/response-plan';
import type { ResponseStore } from '@/lib/events/response-service';

import { eventAnswer, eventGuest, eventResponseLog } from '@/db/schema';

type Statement = BatchItem<'pg'>;

// the production adapter behind ResponseStore. the neon-http driver has no transactions, so the
// whole plan travels as one batch: either every statement lands or none does.
export class DrizzleResponseStore implements ResponseStore {
	public constructor(private readonly database: typeof db) {}

	public async apply(invitationId: string, plan: ResponsePlan): Promise<void> {
		const statements: Statement[] = [
			...this.guestUpdates(plan),
			...this.answerWrites(invitationId, plan),
			...this.answerRemovals(invitationId, plan),
			...this.logEntries(invitationId, plan),
		];

		const [first, ...rest] = statements;

		if (!first) {
			return;
		}

		await this.database.batch([first, ...rest]);
	}

	private guestUpdates(plan: ResponsePlan): Statement[] {
		return plan.guestUpdates.map((update) =>
			this.database
				.update(eventGuest)
				.set({ respondedAt: update.respondedAt, response: update.response })
				.where(eq(eventGuest.id, update.guestId))
		);
	}

	// one answer per field per target, so a repeat submission updates rather than piles up
	private answerWrites(invitationId: string, plan: ResponsePlan): Statement[] {
		return plan.answerWrites.map((write) => {
			const target = write.guestId
				? [eventAnswer.fieldId, eventAnswer.guestId]
				: [eventAnswer.fieldId, eventAnswer.invitationId];

			return this.database
				.insert(eventAnswer)
				.values({
					fieldId: write.fieldId,
					guestId: write.guestId,
					id: crypto.randomUUID(),
					invitationId: write.guestId ? null : invitationId,
					value: write.value,
				})
				.onConflictDoUpdate({ set: { updatedAt: sql`now()`, value: write.value }, target });
		});
	}

	private answerRemovals(invitationId: string, plan: ResponsePlan): Statement[] {
		return plan.answerRemovals.map((removal) =>
			this.database
				.delete(eventAnswer)
				.where(
					and(
						eq(eventAnswer.fieldId, removal.fieldId),
						removal.guestId
							? eq(eventAnswer.guestId, removal.guestId)
							: and(isNull(eventAnswer.guestId), eq(eventAnswer.invitationId, invitationId))
					)
				)
		);
	}

	private logEntries(invitationId: string, plan: ResponsePlan): Statement[] {
		return plan.logEntries.map((entry) =>
			this.database.insert(eventResponseLog).values({
				actor: entry.actor,
				fieldId: entry.fieldId,
				guestId: entry.guestId,
				id: crypto.randomUUID(),
				invitationId,
				kind: entry.kind,
				nextValue: entry.nextValue,
				previousValue: entry.previousValue,
			})
		);
	}
}
