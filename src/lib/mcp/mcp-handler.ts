import { requireMcpAuth } from '@better-auth/mcp';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';

import { auth } from '@/lib/auth/auth';
import { betterAuthMcpGateway } from '@/lib/mcp/better-auth-mcp-gateway';
import { getMcpEndpointUrl, MCP_CONFIG } from '@/lib/mcp/mcp-config';
import { McpProfileService } from '@/lib/mcp/mcp-profile-service';
import { registerProfileTools } from '@/lib/mcp/mcp-tools';

const profileService = new McpProfileService(betterAuthMcpGateway);

const SCOPE_SEPARATOR = ' ';

// oauth puts the granted scopes in a single space-delimited `scope` claim (RFC 8693 §4.2)
function readScopes(claims: Record<string, unknown>): string[] {
	return typeof claims.scope === 'string' ? claims.scope.split(SCOPE_SEPARATOR).filter(Boolean) : [];
}

// one fresh McpServer per request, built from the already-verified token claims
const mcpHttpHandler = createMcpHandler((ctx) => {
	const server = new McpServer(MCP_CONFIG.server);
	const claims = (ctx.authInfo?.extra ?? {}) as Record<string, unknown>;
	const userId = typeof claims.sub === 'string' ? claims.sub : null;

	if (userId) {
		registerProfileTools(server, profileService, userId, readScopes(claims));
	}

	return server;
});

// requireMcpAuth verifies the bearer access token against the authorization server's JWKS
// (signature, issuer, audience, expiry) and answers unauthenticated requests with the RFC 9728
// WWW-Authenticate challenge that lets an MCP client discover where to authorize
export const handleMcpRequest = requireMcpAuth(
	auth,
	async (request, accessTokenClaims) =>
		mcpHttpHandler.fetch(request, {
			authInfo: {
				clientId: typeof accessTokenClaims.client_id === 'string' ? accessTokenClaims.client_id : '',
				expiresAt: accessTokenClaims.exp,
				extra: accessTokenClaims,
				scopes: readScopes(accessTokenClaims),
				token: '',
			},
		}),
	{ resource: getMcpEndpointUrl() }
);
