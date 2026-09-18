import type { McpServer } from '@modelcontextprotocol/server';

import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

import { MCP_APP_RESOURCE_NAME, MCP_APP_RESOURCE_URI } from '@/features/mcp-app/app-contract';
import mcpApp from '@/features/mcp-app/generated/mcp-app.json';

// the MCP App (SEP-1865, extension io.modelcontextprotocol/ui). the host reads this resource once
// per connection and renders it in a sandboxed iframe whenever a tool points at its uri.
//
// the document is entirely self-contained — script and stylesheet are inlined by
// scripts/build-mcp-app.ts — so no csp domains are declared and the host's restrictive default
// applies: the view may talk to nobody but its host.

const DESCRIPTION =
	'Interaktive Ansicht der Events, ihrer Einladungen und des Antwortstands. Einladungen lassen sich darin nach Rückfrage löschen.';

export const MCP_APP_TOOL_META = { ui: { resourceUri: MCP_APP_RESOURCE_URI } } as const;

export function registerMcpApp(server: McpServer): void {
	registerAppResource(
		server,
		MCP_APP_RESOURCE_NAME,
		MCP_APP_RESOURCE_URI,
		{ description: DESCRIPTION },
		async () => ({
			contents: [
				{
					// the view brings the app's own canvas and panels, so it wants a frame around it
					_meta: { ui: { prefersBorder: true } },
					mimeType: RESOURCE_MIME_TYPE,
					text: mcpApp.html,
					uri: MCP_APP_RESOURCE_URI,
				},
			],
		})
	);
}
