import { asc, eq } from 'drizzle-orm';

import type { db } from '@/db/client';
import type { OrganizationStore, PersonalOrganizationRecord } from '@/lib/auth/personal-organization';

import { member, organization } from '@/db/schema';

// the production adapter behind OrganizationStore; tests drive the policy through a fake instead
export class DrizzleOrganizationStore implements OrganizationStore {
	public constructor(private readonly database: typeof db) {}

	public async findMembership(userId: string): Promise<null | { organizationId: string; role: string }> {
		const [row] = await this.database
			.select({ organizationId: member.organizationId, role: member.role })
			.from(member)
			.where(eq(member.userId, userId))
			.orderBy(asc(member.createdAt))
			.limit(1);

		return row ?? null;
	}

	// the neon-http driver has no transactions, so both rows go out as one batch. their ids are
	// derived from the user id, so a repeat run conflicts on the primary key and does nothing.
	public async insertPersonalOrganization(record: PersonalOrganizationRecord): Promise<void> {
		const createdAt = new Date();

		await this.database.batch([
			this.database
				.insert(organization)
				.values({
					createdAt,
					id: record.organizationId,
					name: record.name,
					slug: record.slug,
				})
				.onConflictDoNothing(),
			this.database
				.insert(member)
				.values({
					createdAt,
					id: record.memberId,
					organizationId: record.organizationId,
					role: record.role,
					userId: record.userId,
				})
				.onConflictDoNothing(),
		]);
	}
}
