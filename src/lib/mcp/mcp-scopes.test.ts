import { describe, expect, test } from 'bun:test';

import {
	describeScope,
	labelScope,
	MCP_SCOPE_DESCRIPTIONS,
	MCP_SCOPE_IDS,
	MCP_SCOPE_LABELS,
	MCP_SCOPES,
	parseScopes,
} from '@/lib/mcp/mcp-scopes';

describe('parsing the oauth scope string', () => {
	test('a single scope becomes one entry', () => {
		expect(parseScopes(MCP_SCOPE_IDS.read)).toEqual(['profile:read']);
	});

	test('space-delimited scopes are split', () => {
		expect(parseScopes('openid profile:read profile:write')).toEqual(['openid', 'profile:read', 'profile:write']);
	});

	test('repeated separators do not produce empty scopes', () => {
		expect(parseScopes('  openid   profile:read  ')).toEqual(['openid', 'profile:read']);
	});

	test('an empty string yields no scopes', () => {
		expect(parseScopes('')).toEqual([]);
	});

	test('a missing claim yields no scopes rather than throwing', () => {
		expect(parseScopes(undefined)).toEqual([]);
		expect(parseScopes(null)).toEqual([]);
	});

	test('a non-string claim yields no scopes, so nothing is granted by accident', () => {
		expect(parseScopes(['profile:read'])).toEqual([]);
		expect(parseScopes({ scope: 'profile:read' })).toEqual([]);
		expect(parseScopes(42)).toEqual([]);
	});
});

describe('describing a scope for the consent screen', () => {
	test('a known scope gets its german description', () => {
		expect(describeScope(MCP_SCOPE_IDS.write)).toBe('Deinen Vornamen, Nachnamen und Benutzernamen ändern.');
	});

	test('an unknown scope falls back to its raw id rather than disappearing', () => {
		expect(describeScope('some:future:scope')).toBe('some:future:scope');
	});
});

// the advertised list and the two wordings are three places that have to agree: a scope the
// provider accepts but nobody worded reaches the consent screen as a raw id like 'events:links'
describe('every advertised scope is worded for a human', () => {
	test.each([...MCP_SCOPES])('%s has a description and a short label', (scope) => {
		expect(describeScope(scope)).not.toBe(scope);
		expect(labelScope(scope)).not.toBe(scope);
	});

	test('nothing is worded that the provider would reject as invalid_scope', () => {
		const advertised = new Set<string>(MCP_SCOPES);

		expect(Object.keys(MCP_SCOPE_DESCRIPTIONS).filter((scope) => !advertised.has(scope))).toEqual([]);
		expect(Object.keys(MCP_SCOPE_LABELS).filter((scope) => !advertised.has(scope))).toEqual([]);
	});
});

// without it the provider issues no refresh token and every client re-authorizes hourly
describe('refresh tokens stay reachable', () => {
	test('offline_access is advertised', () => {
		expect([...MCP_SCOPES]).toContain('offline_access');
	});
});
