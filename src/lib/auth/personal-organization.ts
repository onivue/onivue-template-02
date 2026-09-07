// every viewer owns exactly one organization, created for them and never shown in the ui. it
// exists so events have an owner that can grow members later without migrating anything.

const FALLBACK_ORGANIZATION_NAME = 'Meine Events';
const FALLBACK_SLUG_BASE = 'events';
const SLUG_SUFFIX_LENGTH = 8;
const OWNER_ROLE = 'owner';

export type OrganizationRole = 'admin' | 'member' | 'owner';

export type PersonalOrganizationUser = {
	id: string;
	name?: null | string;
	username?: null | string;
};

export type PersonalOrganizationRecord = {
	memberId: string;
	name: string;
	organizationId: string;
	role: OrganizationRole;
	slug: string;
	userId: string;
};

// narrow port over the two statements this needs, so the policy can be driven by a fake
export type OrganizationStore = {
	findMembership(userId: string): Promise<null | { organizationId: string; role: string }>;
	insertPersonalOrganization(record: PersonalOrganizationRecord): Promise<void>;
};

export type Membership = {
	organizationId: string;
	role: OrganizationRole;
};

const COMBINING_MARK_PATTERN = /[\u0300-\u036f]/g;
const UMLAUT_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
	[/ä/g, 'ae'],
	[/ö/g, 'oe'],
	[/ü/g, 'ue'],
	[/ß/g, 'ss'],
];

// german letters are spelled out before the decomposition pass, which would otherwise split them
// into a bare letter and a combining mark and leave 'jo-rg'
function toSlugSegment(value: string): string {
	const spelled = UMLAUT_REPLACEMENTS.reduce(
		(current, [pattern, replacement]) => current.replace(pattern, replacement),
		value.toLowerCase()
	);

	return spelled
		.normalize('NFD')
		.replace(COMBINING_MARK_PATTERN, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function toOrganizationName(user: PersonalOrganizationUser): string {
	const name = user.name?.trim();

	return name ? `Events von ${name}` : FALLBACK_ORGANIZATION_NAME;
}

// derived from the user id, so the same user always produces the same slug and the insert below
// stays repeatable
export function toOrganizationSlug(user: PersonalOrganizationUser): string {
	const base = toSlugSegment(user.username ?? user.name ?? '') || FALLBACK_SLUG_BASE;
	const suffix = toSlugSegment(user.id).slice(-SLUG_SUFFIX_LENGTH) || FALLBACK_SLUG_BASE;

	return `${base}-${suffix}`;
}

// ids are derived from the user id rather than generated, so two concurrent requests write the
// same rows instead of two organizations
export function toPersonalOrganizationRecord(user: PersonalOrganizationUser): PersonalOrganizationRecord {
	return {
		memberId: `personal-member-${user.id}`,
		name: toOrganizationName(user),
		organizationId: `personal-org-${user.id}`,
		role: OWNER_ROLE,
		slug: toOrganizationSlug(user),
		userId: user.id,
	};
}

function toRole(role: string): OrganizationRole {
	if (role === 'owner' || role === 'admin') {
		return role;
	}

	return 'member';
}

// idempotent by design: it runs on registration, and again on the first request of anyone who
// registered before organizations existed. one code path, no backfill migration to keep in step.
export async function ensurePersonalOrganization(
	store: OrganizationStore,
	user: PersonalOrganizationUser
): Promise<Membership> {
	const existing = await store.findMembership(user.id);

	if (existing) {
		return { organizationId: existing.organizationId, role: toRole(existing.role) };
	}

	const record = toPersonalOrganizationRecord(user);

	await store.insertPersonalOrganization(record);

	return { organizationId: record.organizationId, role: record.role };
}
