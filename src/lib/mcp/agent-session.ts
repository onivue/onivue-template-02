import { MCP_SCOPE_IDS, parseScopes } from '@/lib/mcp/mcp-scopes';

export type McpProfile = {
	email: string;
	firstName: string | null;
	lastName: string | null;
	username: string | null;
};

export type McpGatewayError = {
	code?: string;
	message: string;
	status?: number;
};

export type McpGatewayResult<T> = { success: true; data: T } | { success: false; error: McpGatewayError };

// partial by design: an agent only sends the fields it wants to change
export type UpdateMcpProfileParams = {
	firstName?: string;
	lastName?: string;
	username?: string;
};

export type UpdatedProfileField = 'firstName' | 'lastName' | 'username';

// narrow port over better-auth's server api, scoped to what the MCP tools need. keyed by user id:
// the access token is an oauth token, so the caller is identified by its verified `sub` claim
export type McpProfileGateway = {
	getProfile(userId: string): Promise<McpGatewayResult<McpProfile>>;
	updateProfile(userId: string, params: UpdateMcpProfileParams): Promise<McpGatewayResult<McpProfile>>;
};

const UPDATABLE_FIELDS = ['firstName', 'lastName', 'username'] as const satisfies readonly UpdatedProfileField[];

// our own code, so AuthErrorHelper passes the message straight through to the agent
export const MISSING_SCOPE_CODE = 'MISSING_SCOPE';
const FORBIDDEN_STATUS = 403;

function missingScope(scope: string): McpGatewayResult<never> {
	return {
		success: false,
		error: {
			code: MISSING_SCOPE_CODE,
			message: `Diesem Client fehlt der Scope "${scope}".`,
			status: FORBIDDEN_STATUS,
		},
	};
}

// one authenticated MCP request: who is calling and what they were granted, resolved once from the
// verified token claims. tools receive a session, not a user id and a scope list, so no tool can
// forget the scope check and no tool can be called for the wrong user.
export class AgentSession {
	private constructor(
		private readonly gateway: McpProfileGateway,
		private readonly userId: string,
		private readonly scopes: string[]
	) {}

	// there is no session without a verified subject; scopes may legitimately be empty
	public static fromClaims(gateway: McpProfileGateway, claims: Record<string, unknown>): AgentSession | null {
		if (typeof claims.sub !== 'string' || !claims.sub) {
			return null;
		}

		return new AgentSession(gateway, claims.sub, parseScopes(claims.scope));
	}

	public async getProfile(): Promise<McpGatewayResult<{ profile: McpProfile }>> {
		if (!this.scopes.includes(MCP_SCOPE_IDS.read)) {
			return missingScope(MCP_SCOPE_IDS.read);
		}

		const result = await this.gateway.getProfile(this.userId);

		if (!result.success) {
			return result;
		}

		return { success: true, data: { profile: result.data } };
	}

	public async updateProfile(
		params: UpdateMcpProfileParams
	): Promise<McpGatewayResult<{ profile: McpProfile; updatedFields: UpdatedProfileField[] }>> {
		if (!this.scopes.includes(MCP_SCOPE_IDS.write)) {
			return missingScope(MCP_SCOPE_IDS.write);
		}

		const updatedFields = UPDATABLE_FIELDS.filter((field) => params[field] !== undefined);
		const result = await this.gateway.updateProfile(this.userId, params);

		if (!result.success) {
			return result;
		}

		return { success: true, data: { profile: result.data, updatedFields } };
	}
}
