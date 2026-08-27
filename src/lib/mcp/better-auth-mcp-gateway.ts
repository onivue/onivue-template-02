import { APIError } from 'better-auth';

import type {
	McpGatewayError,
	McpGatewayResult,
	McpProfile,
	McpProfileGateway,
	UpdateMcpProfileParams,
} from '@/lib/mcp/mcp-profile-service';

import { auth } from '@/lib/auth/auth';

type McpUserRecord = {
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	username?: string | null;
};

function toProfile(user: McpUserRecord): McpProfile {
	return {
		email: user.email,
		firstName: user.firstName ?? null,
		lastName: user.lastName ?? null,
		username: user.username ?? null,
	};
}

function toGatewayError(error: unknown): McpGatewayError {
	if (error instanceof APIError) {
		return {
			code: error.body?.code,
			message: error.body?.message ?? error.message,
			status: error.statusCode,
		};
	}

	return { message: error instanceof Error ? error.message : 'Unbekannter Fehler.' };
}

async function fetchProfile(userId: string): Promise<McpGatewayResult<McpProfile>> {
	const { internalAdapter } = await auth.$context;
	const user = await internalAdapter.findUserById(userId);

	if (!user) {
		return { success: false, error: { message: 'Nutzer nicht gefunden.', status: 404 } };
	}

	return { success: true, data: toProfile(user as McpUserRecord) };
}

// production adapter: maps the narrow McpProfileGateway port onto better-auth's internal adapter.
// writes go through updateUser, which fires the same `databaseHooks.user.update.before` chain the
// account page hits — username validation (length, characters, profanity, availability) and the
// firstName/lastName checks in auth.ts. there is still no second, laxer validation path.
export const betterAuthMcpGateway: McpProfileGateway = {
	getProfile: async (userId) => fetchProfile(userId),
	updateProfile: async (userId, params: UpdateMcpProfileParams) => {
		try {
			const { internalAdapter } = await auth.$context;

			// `id` is carried in the payload because the username plugin's db hook reads it to
			// exclude the current user from its uniqueness check; without it, re-saving your own
			// username would be rejected as already taken
			await internalAdapter.updateUser(userId, { ...params, id: userId });
		} catch (error) {
			return { success: false, error: toGatewayError(error) };
		}

		// updateUser returns the raw row, so re-read through the same mapping as getProfile
		return fetchProfile(userId);
	},
};
