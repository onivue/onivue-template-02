import { describe, expect, test } from 'bun:test';

import type { McpGatewayResult, McpProfile, McpProfileGateway, UpdateMcpProfileParams } from '@/lib/mcp/agent-session';

import { AgentSession } from '@/lib/mcp/agent-session';
import { MCP_SCOPE_IDS } from '@/lib/mcp/mcp-scopes';

const PROFILE: McpProfile = {
	email: 'albin@example.com',
	firstName: 'Albin',
	lastName: 'Hoti',
	username: 'albin',
};

const BOTH_SCOPES = `${MCP_SCOPE_IDS.read} ${MCP_SCOPE_IDS.write}`;

function createGateway(overrides: Partial<McpProfileGateway> = {}) {
	const calls: { name: 'getProfile' | 'updateProfile'; params?: unknown; userId: string }[] = [];

	const gateway: McpProfileGateway = {
		getProfile: async (userId) => {
			calls.push({ name: 'getProfile', userId });

			return { success: true, data: PROFILE };
		},
		updateProfile: async (userId, params) => {
			calls.push({ name: 'updateProfile', params, userId });

			return { success: true, data: PROFILE };
		},
		...overrides,
	};

	return { calls, gateway };
}

function createSession(claims: Record<string, unknown>, overrides: Partial<McpProfileGateway> = {}) {
	const { calls, gateway } = createGateway(overrides);
	const session = AgentSession.fromClaims(gateway, claims);

	if (!session) {
		throw new Error('expected a session for these claims');
	}

	return { calls, session };
}

describe('a session only exists for a verified subject', () => {
	test('claims without a sub produce no session', () => {
		const { gateway } = createGateway();

		expect(AgentSession.fromClaims(gateway, { scope: BOTH_SCOPES })).toBeNull();
	});

	test('an empty sub produces no session', () => {
		const { gateway } = createGateway();

		expect(AgentSession.fromClaims(gateway, { scope: BOTH_SCOPES, sub: '' })).toBeNull();
	});

	test('a non-string sub produces no session', () => {
		const { gateway } = createGateway();

		expect(AgentSession.fromClaims(gateway, { sub: 42 })).toBeNull();
	});

	test('a sub without any scope claim still produces a session', () => {
		const { gateway } = createGateway();

		expect(AgentSession.fromClaims(gateway, { sub: 'user-1' })).not.toBeNull();
	});
});

describe('the scope gate sits in front of every call', () => {
	test('reading without the read scope is refused before the gateway is touched', async () => {
		const { calls, session } = createSession({ scope: MCP_SCOPE_IDS.write, sub: 'user-1' });

		const result = await session.getProfile();

		expect(result).toEqual({
			success: false,
			error: {
				code: 'MISSING_SCOPE',
				message: 'Diesem Client fehlt der Scope "profile:read".',
				status: 403,
			},
		});
		expect(calls).toEqual([]);
	});

	test('writing without the write scope is refused before the gateway is touched', async () => {
		const { calls, session } = createSession({ scope: MCP_SCOPE_IDS.read, sub: 'user-1' });

		const result = await session.updateProfile({ firstName: 'Neu' });

		expect(result.success).toBe(false);
		expect(!result.success && result.error.message).toBe('Diesem Client fehlt der Scope "profile:write".');
		expect(calls).toEqual([]);
	});

	test('the read scope alone does not grant writes', async () => {
		const { session } = createSession({ scope: MCP_SCOPE_IDS.read, sub: 'user-1' });

		expect((await session.getProfile()).success).toBe(true);
		expect((await session.updateProfile({ username: 'neu' })).success).toBe(false);
	});

	test('a missing scope claim refuses everything', async () => {
		const { session } = createSession({ sub: 'user-1' });

		expect((await session.getProfile()).success).toBe(false);
		expect((await session.updateProfile({ username: 'neu' })).success).toBe(false);
	});

	test('extra scopes granted alongside ours are harmless', async () => {
		const { session } = createSession({ scope: `openid email ${BOTH_SCOPES} offline_access`, sub: 'user-1' });

		expect((await session.getProfile()).success).toBe(true);
		expect((await session.updateProfile({ username: 'neu' })).success).toBe(true);
	});
});

describe('the caller identity comes from the token, never from the tool call', () => {
	test('the verified sub is what reaches the gateway on a read', async () => {
		const { calls, session } = createSession({ scope: BOTH_SCOPES, sub: 'user-1' });

		await session.getProfile();

		expect(calls).toEqual([{ name: 'getProfile', userId: 'user-1' }]);
	});

	test('the verified sub is what reaches the gateway on a write', async () => {
		const { calls, session } = createSession({ scope: BOTH_SCOPES, sub: 'user-1' });

		await session.updateProfile({ firstName: 'Neu' });

		expect(calls).toEqual([{ name: 'updateProfile', params: { firstName: 'Neu' }, userId: 'user-1' }]);
	});
});

describe('reading a profile', () => {
	test('wraps the gateway profile in a profile envelope', async () => {
		const { session } = createSession({ scope: BOTH_SCOPES, sub: 'user-1' });

		expect(await session.getProfile()).toEqual({ success: true, data: { profile: PROFILE } });
	});

	test('passes a gateway failure through unchanged', async () => {
		const failure: McpGatewayResult<McpProfile> = { success: false, error: { message: 'Nutzer nicht gefunden.' } };
		const { session } = createSession({ scope: BOTH_SCOPES, sub: 'user-1' }, { getProfile: async () => failure });

		expect(await session.getProfile()).toEqual(failure);
	});
});

describe('updating a profile', () => {
	test('reports only the fields that were actually sent', async () => {
		const { session } = createSession({ scope: BOTH_SCOPES, sub: 'user-1' });
		const params: UpdateMcpProfileParams = { firstName: 'Neu' };

		expect(await session.updateProfile(params)).toEqual({
			success: true,
			data: { profile: PROFILE, updatedFields: ['firstName'] },
		});
	});

	test('reports every field when all three are sent', async () => {
		const { session } = createSession({ scope: BOTH_SCOPES, sub: 'user-1' });

		const result = await session.updateProfile({ firstName: 'Neu', lastName: 'Name', username: 'neu' });

		expect(result.success && result.data.updatedFields).toEqual(['firstName', 'lastName', 'username']);
	});

	test('reports no fields when none were sent', async () => {
		const { session } = createSession({ scope: BOTH_SCOPES, sub: 'user-1' });

		const result = await session.updateProfile({});

		expect(result.success && result.data.updatedFields).toEqual([]);
	});

	test('passes a gateway failure through unchanged, e.g. a taken username', async () => {
		const failure: McpGatewayResult<McpProfile> = {
			success: false,
			error: { code: 'USERNAME_IS_ALREADY_TAKEN', message: 'Dieser Benutzername ist bereits vergeben.' },
		};
		const { session } = createSession(
			{ scope: BOTH_SCOPES, sub: 'user-1' },
			{ updateProfile: async () => failure }
		);

		expect(await session.updateProfile({ username: 'taken' })).toEqual(failure);
	});
});
