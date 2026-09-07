import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';

import type { AgentSession, McpGatewayResult } from '@/lib/mcp/agent-session';

import { AuthErrorHelper } from '@/lib/auth/auth-error-helper';
import { MCP_CONFIG } from '@/lib/mcp/mcp-config';
import {
	getProfileInputSchema,
	getProfileOutputSchema,
	updateProfileInputSchema,
	updateProfileOutputSchema,
} from '@/lib/mcp/mcp-tool-schema';

const authErrorHelper = new AuthErrorHelper();

// translates the session's discriminated-union result into an MCP CallToolResult
function toCallToolResult<T extends Record<string, unknown>>(
	result: McpGatewayResult<T>,
	fallbackErrorMessage: string
): CallToolResult {
	if (!result.success) {
		const message = authErrorHelper.getUserMessage(result.error, fallbackErrorMessage);

		return { content: [{ text: message, type: 'text' }], isError: true };
	}

	return {
		content: [{ text: JSON.stringify(result.data), type: 'text' }],
		structuredContent: result.data,
	};
}

// registers the profile tools against one AgentSession. the caller's identity and granted scopes
// are already inside it, so the handlers are pure MCP glue: call, translate, return.
export function registerProfileTools(server: McpServer, session: AgentSession): void {
	server.registerTool(
		MCP_CONFIG.tools.getProfile,
		{
			annotations: { readOnlyHint: true },
			description: 'Liest das Profil (E-Mail, Vorname, Nachname, Benutzername) des angemeldeten Nutzers.',
			inputSchema: getProfileInputSchema,
			outputSchema: getProfileOutputSchema,
			title: 'Profil lesen',
		},
		async () => toCallToolResult(await session.getProfile(), 'Das Profil konnte nicht gelesen werden.')
	);

	server.registerTool(
		MCP_CONFIG.tools.updateProfile,
		{
			annotations: { idempotentHint: true },
			description:
				'Ändert Vorname, Nachname und/oder Benutzername des angemeldeten Nutzers. Nur die angegebenen Felder werden geändert.',
			inputSchema: updateProfileInputSchema,
			outputSchema: updateProfileOutputSchema,
			title: 'Profil aktualisieren',
		},
		async (args) =>
			toCallToolResult(await session.updateProfile(args), 'Das Profil konnte nicht aktualisiert werden.')
	);
}
