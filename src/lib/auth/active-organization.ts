import { cache } from 'react';

import { db } from '@/db/client';
import { DrizzleOrganizationStore } from '@/lib/auth/drizzle-organization-store';
import { ensurePersonalOrganization, type Membership } from '@/lib/auth/personal-organization';
import { requireViewer } from '@/lib/auth/viewer';

const organizationStore = new DrizzleOrganizationStore(db);

// the organization every event query filters by. there is no switcher yet, so this is simply the
// viewer's own organization — created on registration, or healed here for anyone who registered
// before organizations existed.
export const getActiveMembership = cache(async (): Promise<Membership> => {
	const viewer = await requireViewer();

	return await ensurePersonalOrganization(organizationStore, {
		id: viewer.id,
		name: viewer.name,
		username: viewer.username,
	});
});
