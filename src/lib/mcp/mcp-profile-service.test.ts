import { describe, expect, test } from 'bun:test';

import type {
	McpGatewayResult,
	McpProfile,
	McpProfileGateway,
	UpdateMcpProfileParams,
} from '@/lib/mcp/mcp-profile-service';

import { McpProfileService } from '@/lib/mcp/mcp-profile-service';

const PROFILE: McpProfile = {
	email: 'albin@example.com',
	firstName: 'Albin',
	lastName: 'Hoti',
	username: 'albin',
};

function createGateway(overrides: Partial<McpProfileGateway> = {}): McpProfileGateway {
	return {
		getProfile: async () => ({ success: true, data: PROFILE }),
		updateProfile: async () => ({ success: true, data: PROFILE }),
		...overrides,
	};
}

describe('McpProfileService.getProfile', () => {
	test('wraps the gateway profile in a profile envelope', async () => {
		const service = new McpProfileService(createGateway());

		const result = await service.getProfile('token');

		expect(result).toEqual({ success: true, data: { profile: PROFILE } });
	});

	test('passes a gateway failure through unchanged', async () => {
		const failure: McpGatewayResult<McpProfile> = { success: false, error: { message: 'Nicht angemeldet.' } };
		const service = new McpProfileService(createGateway({ getProfile: async () => failure }));

		const result = await service.getProfile('token');

		expect(result).toEqual(failure);
	});
});

describe('McpProfileService.updateProfile', () => {
	test('reports only the fields that were actually sent', async () => {
		const service = new McpProfileService(createGateway());
		const params: UpdateMcpProfileParams = { firstName: 'Neu' };

		const result = await service.updateProfile('token', params);

		expect(result).toEqual({ success: true, data: { profile: PROFILE, updatedFields: ['firstName'] } });
	});

	test('reports every field when all three are sent', async () => {
		const service = new McpProfileService(createGateway());
		const params: UpdateMcpProfileParams = { firstName: 'Neu', lastName: 'Name', username: 'neu' };

		const result = await service.updateProfile('token', params);

		expect(result.success && result.data.updatedFields).toEqual(['firstName', 'lastName', 'username']);
	});

	test('reports no fields when none were sent', async () => {
		const service = new McpProfileService(createGateway());

		const result = await service.updateProfile('token', {});

		expect(result.success && result.data.updatedFields).toEqual([]);
	});

	test('passes a gateway failure through unchanged, e.g. a taken username', async () => {
		const failure: McpGatewayResult<McpProfile> = {
			success: false,
			error: { code: 'USERNAME_IS_ALREADY_TAKEN', message: 'Dieser Benutzername ist bereits vergeben.' },
		};
		const service = new McpProfileService(createGateway({ updateProfile: async () => failure }));

		const result = await service.updateProfile('token', { username: 'taken' });

		expect(result).toEqual(failure);
	});
});
