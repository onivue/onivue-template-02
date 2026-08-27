import type { ConsentRecord, McpConnectionSummary } from '@/lib/mcp/mcp-connection';

import { toConnectionSummary } from '@/lib/mcp/mcp-connection';

// everything the account page needs about a viewer beyond the viewer itself
export type AccountOverview = {
	connections: McpConnectionSummary[];
	hasPassword: boolean;
};

// narrow port over the viewer's own records. it returns rows, not answers: the shaping rules stay
// in this module so they can be driven by the in-memory adapter
export type AccountRecordGateway = {
	hasCredentialPassword(userId: string): Promise<boolean>;
	listConsents(userId: string): Promise<ConsentRecord[]>;
};

// the two reads are independent, so they run together rather than as a waterfall
export async function loadAccountOverview(gateway: AccountRecordGateway, userId: string): Promise<AccountOverview> {
	const [hasPassword, consents] = await Promise.all([
		gateway.hasCredentialPassword(userId),
		gateway.listConsents(userId),
	]);

	return { connections: consents.map(toConnectionSummary), hasPassword };
}
