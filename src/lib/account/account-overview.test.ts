import { describe, expect, test } from 'bun:test';

import type { ConsentRecord } from '@/lib/mcp/mcp-connection';

import { loadAccountOverview } from '@/lib/account/account-overview';
import { InMemoryAccountGateway } from '@/lib/account/in-memory-account-gateway';

const CONNECTED_AT = new Date('2026-08-01T10:00:00Z');

function consent(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
	return {
		clientId: 'client-abc',
		createdAt: CONNECTED_AT,
		id: 'consent-1',
		name: 'Claude Desktop',
		scopes: ['profile:read'],
		...overrides,
	};
}

describe('password status', () => {
	test('a viewer with a credential row has a password', async () => {
		const gateway = new InMemoryAccountGateway({ withPassword: ['user-1'] });

		expect((await loadAccountOverview(gateway, 'user-1')).hasPassword).toBe(true);
	});

	test('a viewer without one does not', async () => {
		const gateway = new InMemoryAccountGateway({ withPassword: ['someone-else'] });

		expect((await loadAccountOverview(gateway, 'user-1')).hasPassword).toBe(false);
	});
});

describe('consent rows become connection summaries', () => {
	test('a named client keeps its name', async () => {
		const gateway = new InMemoryAccountGateway({ consents: { 'user-1': [consent()] } });

		const { connections } = await loadAccountOverview(gateway, 'user-1');

		expect(connections).toEqual([
			{
				clientId: 'client-abc',
				clientName: 'Claude Desktop',
				connectedAt: CONNECTED_AT,
				id: 'consent-1',
				scopes: ['profile:read'],
			},
		]);
	});

	test('a client that registered without a name falls back to its id', async () => {
		const gateway = new InMemoryAccountGateway({ consents: { 'user-1': [consent({ name: null })] } });

		const { connections } = await loadAccountOverview(gateway, 'user-1');

		expect(connections[0]?.clientName).toBe('client-abc');
	});

	test('missing scopes become an empty list rather than null', async () => {
		const gateway = new InMemoryAccountGateway({ consents: { 'user-1': [consent({ scopes: null })] } });

		const { connections } = await loadAccountOverview(gateway, 'user-1');

		expect(connections[0]?.scopes).toEqual([]);
	});

	test('a missing timestamp is carried through as null', async () => {
		const gateway = new InMemoryAccountGateway({ consents: { 'user-1': [consent({ createdAt: null })] } });

		const { connections } = await loadAccountOverview(gateway, 'user-1');

		expect(connections[0]?.connectedAt).toBeNull();
	});

	test('a viewer with no consents gets an empty list', async () => {
		const gateway = new InMemoryAccountGateway();

		expect((await loadAccountOverview(gateway, 'user-1')).connections).toEqual([]);
	});

	test('only the asked-for viewer’s consents are returned', async () => {
		const gateway = new InMemoryAccountGateway({
			consents: { 'user-1': [consent()], 'user-2': [consent({ id: 'consent-2' })] },
		});

		const { connections } = await loadAccountOverview(gateway, 'user-1');

		expect(connections.map((entry) => entry.id)).toEqual(['consent-1']);
	});
});

describe('the two reads run together', () => {
	test('neither read waits for the other to finish', async () => {
		// the gateway only resolves once both reads have started, so a serial caller never returns
		const gateway = new InMemoryAccountGateway({ gateOnBothReads: true, withPassword: ['user-1'] });

		const overview = await loadAccountOverview(gateway, 'user-1');

		expect(overview).toEqual({ connections: [], hasPassword: true });
		expect(gateway.startedReads).toEqual(['hasCredentialPassword', 'listConsents']);
	});
});
