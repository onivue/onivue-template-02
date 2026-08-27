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

export class McpProfileService {
	public constructor(private readonly gateway: McpProfileGateway) {}

	public async getProfile(userId: string): Promise<McpGatewayResult<{ profile: McpProfile }>> {
		const result = await this.gateway.getProfile(userId);

		if (!result.success) {
			return result;
		}

		return { success: true, data: { profile: result.data } };
	}

	public async updateProfile(
		userId: string,
		params: UpdateMcpProfileParams
	): Promise<McpGatewayResult<{ profile: McpProfile; updatedFields: UpdatedProfileField[] }>> {
		const updatedFields = UPDATABLE_FIELDS.filter((field) => params[field] !== undefined);
		const result = await this.gateway.updateProfile(userId, params);

		if (!result.success) {
			return result;
		}

		return { success: true, data: { profile: result.data, updatedFields } };
	}
}
