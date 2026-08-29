import { requireMcpAuth } from '@better-auth/mcp';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';

import { auth } from '@/lib/auth/auth';
import { AgentSession } from '@/lib/mcp/agent-session';
import { betterAuthMcpGateway } from '@/lib/mcp/better-auth-mcp-gateway';
import { EventSession } from '@/lib/mcp/event-session';
import { getMcpEndpointUrl, MCP_CONFIG } from '@/lib/mcp/mcp-config';
import { McpEventService } from '@/lib/mcp/mcp-event-service';
import { registerEventTools } from '@/lib/mcp/mcp-event-tools';
import { parseScopes } from '@/lib/mcp/mcp-scopes';
import { registerProfileTools } from '@/lib/mcp/mcp-tools';

const eventService = new McpEventService();

// one fresh McpServer per request, built from the already-verified token claims
const mcpHttpHandler = createMcpHandler((ctx) => {
	const server = new McpServer(MCP_CONFIG.server);
	const claims = (ctx.authInfo?.extra ?? {}) as Record<string, unknown>;
	const session = AgentSession.fromClaims(betterAuthMcpGateway, claims);
	const eventSession = EventSession.fromClaims(eventService, claims);

	if (session) {
		registerProfileTools(server, session);
	}

	if (eventSession) {
		registerEventTools(server, eventSession);
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
				scopes: parseScopes(accessTokenClaims.scope),
				token: '',
			},
		}),
	{ resource: getMcpEndpointUrl() }
);
