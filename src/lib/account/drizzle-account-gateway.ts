import { and, eq, isNotNull } from 'drizzle-orm';

import type { AccountRecordGateway } from '@/lib/account/account-overview';
import type { ConsentRecord } from '@/lib/mcp/mcp-connection';

import { db } from '@/db/client';
import { account, oauthClient, oauthConsent } from '@/db/schema';

const CREDENTIAL_PROVIDER_ID = 'credential';

// production adapter: the only place the account page's reads touch drizzle
export const drizzleAccountGateway: AccountRecordGateway = {
	// a user only has a usable password once a credential account row carries a hash
	hasCredentialPassword: async (userId: string): Promise<boolean> => {
		const [row] = await db
			.select({ id: account.id })
			.from(account)
			.where(
				and(
					eq(account.userId, userId),
					eq(account.providerId, CREDENTIAL_PROVIDER_ID),
					isNotNull(account.password)
				)
			)
			.limit(1);

		return !!row;
	},

	// a consent row is the durable "this client may act for me" record: it outlives any single
	// access token, so it — not the token table — is what the account page lists and what revoking
	// removes
	listConsents: async (userId: string): Promise<ConsentRecord[]> =>
		await db
			.select({
				clientId: oauthConsent.clientId,
				createdAt: oauthConsent.createdAt,
				id: oauthConsent.id,
				name: oauthClient.name,
				scopes: oauthConsent.scopes,
			})
			.from(oauthConsent)
			.innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
			.where(eq(oauthConsent.userId, userId)),
};
