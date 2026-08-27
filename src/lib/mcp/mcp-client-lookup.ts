import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { oauthClient } from '@/db/schema';
import { toClientName } from '@/lib/mcp/mcp-connection';

export type McpClientInfo = {
	clientId: string;
	name: string;
	uri: string | null;
};

export async function findOAuthClient(clientId: string): Promise<McpClientInfo | null> {
	const [row] = await db
		.select({ clientId: oauthClient.clientId, name: oauthClient.name, uri: oauthClient.uri })
		.from(oauthClient)
		.where(eq(oauthClient.clientId, clientId))
		.limit(1);

	if (!row) {
		return null;
	}

	return { clientId: row.clientId, name: toClientName(row.name, row.clientId), uri: row.uri };
}
