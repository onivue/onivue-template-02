import { describe, expect, test } from 'bun:test';

import {
	ensurePersonalOrganization,
	type OrganizationStore,
	type PersonalOrganizationRecord,
	toOrganizationName,
	toOrganizationSlug,
	toPersonalOrganizationRecord,
} from '@/lib/auth/personal-organization';

const USER = { id: 'user-abc12345', name: 'Albin Hoti', username: 'albin' };

function createStore(existing: null | { organizationId: string; role: string }): {
	inserted: PersonalOrganizationRecord[];
	store: OrganizationStore;
} {
	const inserted: PersonalOrganizationRecord[] = [];

	return {
		inserted,
		store: {
			findMembership: async () => existing,
			insertPersonalOrganization: async (record) => {
				inserted.push(record);
			},
		},
	};
}

describe('personal organization naming', () => {
	test('the name carries the person, with a fallback when there is none', () => {
		expect(toOrganizationName(USER)).toBe('Events von Albin Hoti');
		expect(toOrganizationName({ id: 'user-1', name: '   ' })).toBe('Meine Events');
	});

	test('the slug folds german characters and ends in the user id', () => {
		expect(toOrganizationSlug({ id: 'user-abc12345', name: 'Jörg Weiß' })).toBe('joerg-weiss-abc12345');
	});

	test('the same user always produces the same slug and ids', () => {
		expect(toPersonalOrganizationRecord(USER)).toEqual(toPersonalOrganizationRecord(USER));
		expect(toPersonalOrganizationRecord(USER).organizationId).toBe('personal-org-user-abc12345');
	});

	test('a user without name or username still gets a usable slug', () => {
		expect(toOrganizationSlug({ id: 'user-abc12345' })).toBe('events-abc12345');
	});
});

describe('ensuring the personal organization', () => {
	test('an existing membership is returned untouched', async () => {
		const { inserted, store } = createStore({ organizationId: 'org-7', role: 'owner' });

		const membership = await ensurePersonalOrganization(store, USER);

		expect(membership).toEqual({ organizationId: 'org-7', role: 'owner' });
		expect(inserted).toHaveLength(0);
	});

	test('an unknown role is narrowed to member rather than trusted', async () => {
		const { store } = createStore({ organizationId: 'org-7', role: 'moderator' });

		expect(await ensurePersonalOrganization(store, USER)).toEqual({
			organizationId: 'org-7',
			role: 'member',
		});
	});

	test('a viewer without membership gets one, as owner', async () => {
		const { inserted, store } = createStore(null);

		const membership = await ensurePersonalOrganization(store, USER);

		expect(membership).toEqual({ organizationId: 'personal-org-user-abc12345', role: 'owner' });
		expect(inserted).toEqual([
			{
				memberId: 'personal-member-user-abc12345',
				name: 'Events von Albin Hoti',
				organizationId: 'personal-org-user-abc12345',
				role: 'owner',
				slug: 'albin-abc12345',
				userId: 'user-abc12345',
			},
		]);
	});
});
