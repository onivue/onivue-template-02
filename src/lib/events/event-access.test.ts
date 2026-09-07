import { describe, expect, test } from 'bun:test';

import type { Membership } from '@/lib/auth/personal-organization';

import { EventAccess, type EventLookup, type EventSummary } from '@/lib/events/event-access';

const EVENT: EventSummary = { id: 'ev-1', organizationId: 'org-1', status: 'active', title: 'Hochzeit' };

const OWNER: Membership = { organizationId: 'org-1', role: 'owner' };
const MEMBER: Membership = { organizationId: 'org-1', role: 'member' };
const OUTSIDER: Membership = { organizationId: 'org-2', role: 'owner' };

function createAccess(): { access: EventAccess; asked: { eventId: string; organizationId: string }[] } {
	const asked: { eventId: string; organizationId: string }[] = [];
	const lookup: EventLookup = {
		findEvent: async (eventId, organizationId) => {
			asked.push({ eventId, organizationId });

			return eventId === EVENT.id && organizationId === EVENT.organizationId ? EVENT : null;
		},
	};

	return { access: new EventAccess(lookup), asked };
}

describe('event access', () => {
	test('any member of the organization may manage its events', async () => {
		const { access } = createAccess();

		expect(await access.forManaging('ev-1', MEMBER)).toEqual({ data: EVENT, success: true });
	});

	test('the lookup is always scoped by organization, never by event alone', async () => {
		const { access, asked } = createAccess();

		await access.forManaging('ev-1', MEMBER);

		expect(asked).toEqual([{ eventId: 'ev-1', organizationId: 'org-1' }]);
	});

	test("another organization's event is missing, not forbidden", async () => {
		const { access } = createAccess();

		expect(await access.forManaging('ev-1', OUTSIDER)).toEqual({ error: 'not-found', success: false });
	});

	test('deleting is reserved for owner and admin', async () => {
		const { access } = createAccess();

		expect(await access.forDeleting('ev-1', OWNER)).toEqual({ data: EVENT, success: true });
		expect(await access.forDeleting('ev-1', { organizationId: 'org-1', role: 'admin' })).toEqual({
			data: EVENT,
			success: true,
		});
		expect(await access.forDeleting('ev-1', MEMBER)).toEqual({ error: 'forbidden', success: false });
	});

	test('a member of another organization is told nothing, even about deletion', async () => {
		const { access } = createAccess();

		expect(await access.forDeleting('ev-1', OUTSIDER)).toEqual({ error: 'not-found', success: false });
	});
});
