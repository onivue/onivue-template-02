import type { McpServer } from '@modelcontextprotocol/server';

import { describe, expect, test } from 'bun:test';

import type { McpEventPort } from '@/lib/mcp/mcp-event-service';

import { MCP_APP_RESOURCE_URI } from '@/features/mcp-app/app-contract';
import { registerMcpApp } from '@/features/mcp-app/mcp-app-resource';
import { EventSession } from '@/lib/mcp/event-session';
import { registerEventTools } from '@/lib/mcp/mcp-event-tools';
import { MCP_SCOPE_IDS } from '@/lib/mcp/mcp-scopes';

type TRegisteredTool = { config: Record<string, unknown>; name: string };
type TRegisteredResource = { config: Record<string, unknown>; name: string; read: () => Promise<unknown>; uri: string };

// a stand-in for McpServer that only records what was registered — enough to hold the wiring in
// place, and it needs neither a transport nor a database
function recordingServer() {
	const resources: TRegisteredResource[] = [];
	const tools: TRegisteredTool[] = [];

	const server = {
		registerResource: (
			name: string,
			uri: string,
			config: Record<string, unknown>,
			read: () => Promise<unknown>
		) => {
			resources.push({ config, name, read, uri });
		},
		registerTool: (name: string, config: Record<string, unknown>) => {
			tools.push({ config, name });
		},
	};

	return { resources, server: server as unknown as McpServer, tools };
}

function register() {
	const { resources, server, tools } = recordingServer();
	const port = {} as McpEventPort;
	const session = EventSession.fromClaims(port, {
		scope: `${MCP_SCOPE_IDS.eventsRead} ${MCP_SCOPE_IDS.eventsWrite}`,
		sub: 'user-1',
	});

	if (!session) {
		throw new Error('session');
	}

	registerMcpApp(server);
	registerEventTools(server, session);

	return { resources, tools };
}

function toolNamed(tools: TRegisteredTool[], name: string): TRegisteredTool {
	const tool = tools.find((entry) => entry.name === name);

	if (!tool) {
		throw new Error(`tool ${name} not registered`);
	}

	return tool;
}

describe('the MCP app resource', () => {
	test('is registered under its ui:// uri with the mcp-app mime type', async () => {
		const { resources } = register();
		const resource = resources.find((entry) => entry.uri === MCP_APP_RESOURCE_URI);

		expect(resource).toBeDefined();

		const read = (await resource!.read()) as { contents: { mimeType: string; text: string; uri: string }[] };

		expect(read.contents[0]?.mimeType).toBe('text/html;profile=mcp-app');
		expect(read.contents[0]?.uri).toBe(MCP_APP_RESOURCE_URI);
		expect(read.contents[0]?.text).toContain('<!doctype html>');
	});

	test('carries no csp domains, so the host applies its restrictive default', async () => {
		const { resources } = register();
		const resource = resources.find((entry) => entry.uri === MCP_APP_RESOURCE_URI);
		const read = (await resource!.read()) as { contents: { _meta?: { ui?: { csp?: unknown } } }[] };

		expect(read.contents[0]?._meta?.ui?.csp).toBeUndefined();
	});

	test('requests clipboard-write, so the "Link kopieren" button works in the sandbox', async () => {
		const { resources } = register();
		const resource = resources.find((entry) => entry.uri === MCP_APP_RESOURCE_URI);
		const read = (await resource!.read()) as {
			contents: { _meta?: { ui?: { permissions?: { clipboardWrite?: object } } } }[];
		};

		expect(read.contents[0]?._meta?.ui?.permissions?.clipboardWrite).toEqual({});
	});
});

describe('the event tools', () => {
	test('point list_events at the app without touching its input', () => {
		const { tools } = register();
		const listEvents = toolNamed(tools, 'list_events');

		// registerAppTool mirrors the uri onto the deprecated flat key for hosts that predate the
		// nested form; the tool itself only ever declares _meta.ui
		expect(listEvents.config._meta).toEqual({
			ui: { resourceUri: MCP_APP_RESOURCE_URI },
			'ui/resourceUri': MCP_APP_RESOURCE_URI,
		});
		expect(listEvents.config.annotations).toEqual({ readOnlyHint: true });

		const inputSchema = listEvents.config.inputSchema as { shape: Record<string, unknown> };

		expect(Object.keys(inputSchema.shape)).toEqual(['includeArchived']);
	});

	// only one tool opens the app; the ones it drives stay plain tools with their own semantics
	test('leave the tools the app calls unchanged', () => {
		const { tools } = register();

		expect(toolNamed(tools, 'get_event').config._meta).toBeUndefined();
		expect(toolNamed(tools, 'add_invitations').config._meta).toBeUndefined();
		expect(toolNamed(tools, 'mark_invitation_sent').config._meta).toBeUndefined();
		expect(toolNamed(tools, 'get_invitation_links').config._meta).toBeUndefined();
		expect(toolNamed(tools, 'delete_invitation').config._meta).toBeUndefined();
		expect(toolNamed(tools, 'delete_invitation').config.annotations).toEqual({ destructiveHint: true });
	});
});
