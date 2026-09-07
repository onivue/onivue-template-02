import { describe, expect, test } from 'bun:test';

import type { Submission } from '@/lib/events/form-schema';
import type { InvitationState, ResponsePlan } from '@/lib/events/response-plan';

import { ResponseService, type ResponseStore, type SubmitParams } from '@/lib/events/response-service';

const NOW = new Date('2026-03-01T12:00:00Z');
const PAST = new Date('2026-02-01T12:00:00Z');
const FUTURE = new Date('2026-04-01T12:00:00Z');

const STATE: InvitationState = { answers: [], guests: [{ id: 'g1', respondedAt: null, response: 'open' }] };
const SUBMISSION: Submission = { answers: {}, guests: { g1: { answers: {}, response: 'accepted' } } };

function createService(): { applied: { invitationId: string; plan: ResponsePlan }[]; service: ResponseService } {
	const applied: { invitationId: string; plan: ResponsePlan }[] = [];
	const store: ResponseStore = {
		apply: async (invitationId, plan) => {
			applied.push({ invitationId, plan });
		},
	};

	return { applied, service: new ResponseService(store, () => NOW) };
}

function params(overrides: Partial<SubmitParams> = {}): SubmitParams {
	return {
		actor: 'guest',
		invitationId: 'inv-1',
		state: STATE,
		submission: SUBMISSION,
		window: { eventDeadline: FUTURE, eventStatus: 'active', invitationDeadline: null },
		...overrides,
	};
}

describe('submitting a response', () => {
	test('an open invitation is written and reported as changed', async () => {
		const { applied, service } = createService();

		expect(await service.submit(params())).toEqual({ changed: true, success: true });
		expect(applied[0]?.invitationId).toBe('inv-1');
		expect(applied[0]?.plan.guestUpdates).toHaveLength(1);
	});

	test('a passed deadline refuses the write, however the page looked', async () => {
		const { applied, service } = createService();

		const result = await service.submit(
			params({ window: { eventDeadline: PAST, eventStatus: 'active', invitationDeadline: null } })
		);

		expect(result).toEqual({ error: 'deadline-passed', success: false });
		expect(applied).toEqual([]);
	});

	test('an archived event refuses the write', async () => {
		const { applied, service } = createService();

		const result = await service.submit(
			params({ window: { eventDeadline: FUTURE, eventStatus: 'archived', invitationDeadline: null } })
		);

		expect(result).toEqual({ error: 'archived', success: false });
		expect(applied).toEqual([]);
	});

	test('a later invitation deadline lets a straggler through', async () => {
		const { service } = createService();

		const result = await service.submit(
			params({ window: { eventDeadline: PAST, eventStatus: 'active', invitationDeadline: FUTURE } })
		);

		expect(result).toEqual({ changed: true, success: true });
	});

	test('the host may still correct the event after the deadline', async () => {
		const { applied, service } = createService();

		const result = await service.submit(
			params({ actor: 'admin', window: { eventDeadline: PAST, eventStatus: 'active', invitationDeadline: null } })
		);

		expect(result).toEqual({ changed: true, success: true });
		expect(applied[0]?.plan.logEntries[0]?.actor).toBe('admin');
	});

	test('a submission that changes nothing never touches the database', async () => {
		const { applied, service } = createService();

		const result = await service.submit(
			params({ submission: { answers: {}, guests: { g1: { answers: {}, response: 'open' } } } })
		);

		expect(result).toEqual({ changed: false, success: true });
		expect(applied).toEqual([]);
	});
});
