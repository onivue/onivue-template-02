// pure shapes and mapping for MCP connections: no database, so both the read module and its
// in-memory adapter can share them

export type McpConnectionSummary = {
	clientId: string;
	clientName: string;
	connectedAt: Date | null;
	id: string;
	scopes: string[];
};

// one consent row as the database hands it over, before any naming or defaulting is applied
export type ConsentRecord = {
	clientId: string;
	createdAt: Date | null;
	id: string;
	name: string | null;
	scopes: string[] | null;
};

// dynamically registered clients pick their own name, so fall back to the raw id when they omit it
export function toClientName(name: string | null, clientId: string): string {
	return name ?? clientId;
}

export function toConnectionSummary(record: ConsentRecord): McpConnectionSummary {
	return {
		clientId: record.clientId,
		clientName: toClientName(record.name, record.clientId),
		connectedAt: record.createdAt,
		id: record.id,
		scopes: record.scopes ?? [],
	};
}
