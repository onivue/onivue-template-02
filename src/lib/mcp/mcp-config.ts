import { APP_CONFIG } from '@/config/app';
import { SERVER_CONFIG } from '@/config/env';
import { MCP_SCOPE_IDS } from '@/lib/mcp/mcp-scopes';

// server-only: reads SERVER_CONFIG, so never import this from a client component
export const MCP_CONFIG = {
	server: {
		name: `${APP_CONFIG.app.name}-mcp`,
		version: '0.1.0',
	},
	endpointPath: '/api/mcp',
	// oauth scopes the authorization server issues for this resource
	scopes: MCP_SCOPE_IDS,
	tools: {
		addInvitations: 'add_invitations',
		createEvent: 'create_event',
		getEvent: 'get_event',
		getProfile: 'get_profile',
		listEvents: 'list_events',
		markInvitationSent: 'mark_invitation_sent',
		updateEvent: 'update_event',
		updateProfile: 'update_profile',
	},
} as const;

export function getMcpEndpointUrl(): string {
	return new URL(MCP_CONFIG.endpointPath, SERVER_CONFIG.auth.baseUrl).toString();
}
