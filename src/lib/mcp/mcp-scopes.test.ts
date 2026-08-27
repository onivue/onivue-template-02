import { describe, expect, test } from 'bun:test';

import { describeScope, MCP_SCOPE_IDS, parseScopes } from '@/lib/mcp/mcp-scopes';

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
