import type { EventPatch } from '@/lib/events/event-repository';
import type { McpEventResult, McpEventService, McpEventSummary } from '@/lib/mcp/mcp-event-service';

import { MCP_SCOPE_IDS, parseScopes } from '@/lib/mcp/mcp-scopes';

function missingScope<T>(scope: string): McpEventResult<T> {
	return { error: `Diesem Client fehlt der Scope "${scope}".`, success: false };
}

// the event half of one authenticated MCP request, mirroring AgentSession: who is calling and what
// they were granted, resolved once from the verified token claims. tools receive a session, not a
// user id and a scope list, so no tool can forget the scope check or be called for the wrong user.
export class EventSession {
	private constructor(
		private readonly service: McpEventService,
		private readonly userId: string,
		private readonly scopes: string[]
	) {}

	// there is no session without a verified subject; scopes may legitimately be empty
	public static fromClaims(service: McpEventService, claims: Record<string, unknown>): EventSession | null {
		if (typeof claims.sub !== 'string' || !claims.sub) {
			return null;
		}

		return new EventSession(service, claims.sub, parseScopes(claims.scope));
	}

	public async listEvents(includeArchived: boolean): Promise<McpEventResult<{ events: McpEventSummary[] }>> {
		if (!this.canRead()) {
			return missingScope(MCP_SCOPE_IDS.eventsRead);
		}

		return await this.service.listEvents(this.userId, includeArchived);
	}

	public async getEvent(eventId: string): Promise<McpEventResult<{ event: unknown }>> {
		if (!this.canRead()) {
			return missingScope(MCP_SCOPE_IDS.eventsRead);
		}

		return await this.service.getEvent(this.userId, eventId);
	}

	public async createEvent(title: string): Promise<McpEventResult<{ eventId: string }>> {
		if (!this.canWrite()) {
			return missingScope(MCP_SCOPE_IDS.eventsWrite);
		}

		return await this.service.createEvent(this.userId, title);
	}

	public async updateEvent(eventId: string, patch: EventPatch): Promise<McpEventResult<{ eventId: string }>> {
		if (!this.canWrite()) {
			return missingScope(MCP_SCOPE_IDS.eventsWrite);
		}

		return await this.service.updateEvent(this.userId, eventId, patch);
	}

	public async addInvitations(eventId: string, rawList: string): Promise<McpEventResult<{ created: number }>> {
		if (!this.canWrite()) {
			return missingScope(MCP_SCOPE_IDS.eventsWrite);
		}

		return await this.service.addInvitations(this.userId, eventId, rawList);
	}

	public async markInvitationSent(
		eventId: string,
		invitationId: string,
		sent: boolean
	): Promise<McpEventResult<{ invitationId: string }>> {
		if (!this.canWrite()) {
			return missingScope(MCP_SCOPE_IDS.eventsWrite);
		}

		return await this.service.markInvitationSent(this.userId, eventId, invitationId, sent);
	}

	private canRead(): boolean {
		return this.scopes.includes(MCP_SCOPE_IDS.eventsRead);
	}

	private canWrite(): boolean {
		return this.scopes.includes(MCP_SCOPE_IDS.eventsWrite);
	}
}
