import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { oauthClient, oauthConsent } from '@/db/schema';

export type McpConnectionSummary = {
	clientId: string;
	clientName: string;
	connectedAt: Date | null;
	id: string;
	scopes: string[];
};

// a consent row is the durable "this client may act for me" record: it outlives any single access
// token, so it — not the token table — is what the account page lists and what revoking removes
export async function listMcpConnections(userId: string): Promise<McpConnectionSummary[]> {
	const rows = await db
		.select({
			clientId: oauthConsent.clientId,
			createdAt: oauthConsent.createdAt,
			id: oauthConsent.id,
			name: oauthClient.name,
			scopes: oauthConsent.scopes,
		})
		.from(oauthConsent)
		.innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
		.where(eq(oauthConsent.userId, userId));

	return rows.map((row) => ({
		clientId: row.clientId,
		clientName: row.name ?? row.clientId,
		connectedAt: row.createdAt,
		id: row.id,
		scopes: row.scopes ?? [],
	}));
}
