import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';

import type { McpGatewayResult, McpProfileService } from '@/lib/mcp/mcp-profile-service';

import { AuthErrorHelper } from '@/lib/auth/auth-error-helper';
import { MCP_CONFIG } from '@/lib/mcp/mcp-config';
import {
	getProfileInputSchema,
	getProfileOutputSchema,
	updateProfileInputSchema,
	updateProfileOutputSchema,
} from '@/lib/mcp/mcp-tool-schema';

const authErrorHelper = new AuthErrorHelper();

// translates the service's discriminated-union result into an MCP CallToolResult
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

function missingScopeResult(scope: string): CallToolResult {
	return {
		content: [{ text: `Diesem Client fehlt der Scope "${scope}".`, type: 'text' }],
		isError: true,
	};
}

// registers the profile tools for one authenticated request. userId and scopes both come from the
// access token claims that requireMcpAuth already verified against the authorization server's JWKS.
// the scopes are checked per tool rather than per route because reading and writing need different
// ones, and a route-level gate would force a client to hold both for either call
export function registerProfileTools(
	server: McpServer,
	service: McpProfileService,
	userId: string,
	scopes: string[]
): void {
	server.registerTool(
		MCP_CONFIG.tools.getProfile,
		{
			annotations: { readOnlyHint: true },
			description: 'Liest das Profil (E-Mail, Vorname, Nachname, Benutzername) des angemeldeten Nutzers.',
			inputSchema: getProfileInputSchema,
			outputSchema: getProfileOutputSchema,
			title: 'Profil lesen',
		},
		async () => {
			if (!scopes.includes(MCP_CONFIG.scopes.read)) {
				return missingScopeResult(MCP_CONFIG.scopes.read);
			}

			const result = await service.getProfile(userId);

			return toCallToolResult(result, 'Das Profil konnte nicht gelesen werden.');
		}
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
		async (args) => {
			if (!scopes.includes(MCP_CONFIG.scopes.write)) {
				return missingScopeResult(MCP_CONFIG.scopes.write);
			}

			const result = await service.updateProfile(userId, args);

			return toCallToolResult(result, 'Das Profil konnte nicht aktualisiert werden.');
		}
	);
}
