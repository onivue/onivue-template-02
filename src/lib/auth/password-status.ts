import { and, eq, isNotNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { account } from '@/db/schema';

const CREDENTIAL_PROVIDER_ID = 'credential';

// a user only has a usable password once a credential account row carries a hash
export async function hasCredentialPassword(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ id: account.id })
		.from(account)
		.where(
			and(eq(account.userId, userId), eq(account.providerId, CREDENTIAL_PROVIDER_ID), isNotNull(account.password))
		)
		.limit(1);

	return !!row;
}
