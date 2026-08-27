import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { oauthClient } from '@/db/schema';

export type McpClientInfo = {
	clientId: string;
	name: string;
	uri: string | null;
};

// dynamically registered clients pick their own name, so fall back to the raw id when they omit it
export async function findOAuthClient(clientId: string): Promise<McpClientInfo | null> {
	const [row] = await db
		.select({ clientId: oauthClient.clientId, name: oauthClient.name, uri: oauthClient.uri })
		.from(oauthClient)
		.where(eq(oauthClient.clientId, clientId))
		.limit(1);

	if (!row) {
		return null;
	}

	return { clientId: row.clientId, name: row.name ?? row.clientId, uri: row.uri };
}
