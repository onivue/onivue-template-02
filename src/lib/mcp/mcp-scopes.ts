// scope ids and their descriptions, kept free of server config so client components can import them

export const MCP_SCOPE_IDS = {
	eventsLinks: 'events:links',
	eventsRead: 'events:read',
	eventsWrite: 'events:write',
	// standard oauth rather than one of ours, and required: the provider issues a refresh token
	// only when this scope was granted, so without it every client has to run the whole
	// authorization flow again as soon as the one-hour access token expires
	offline: 'offline_access',
	read: 'profile:read',
	write: 'profile:write',
} as const;

// every scope a client may request, in the order shown on the consent screen. the authorization
// server advertises exactly this list and rejects anything outside it with invalid_scope, so a
// scope missing here cannot be granted at all — not even when a client asks for it by name.
export const MCP_SCOPES = [
	MCP_SCOPE_IDS.read,
	MCP_SCOPE_IDS.write,
	MCP_SCOPE_IDS.eventsRead,
	MCP_SCOPE_IDS.eventsWrite,
	MCP_SCOPE_IDS.eventsLinks,
	MCP_SCOPE_IDS.offline,
] as const;

// what each scope means, in plain German, for the consent screen
export const MCP_SCOPE_DESCRIPTIONS: Record<string, string> = {
	[MCP_SCOPE_IDS.read]: 'Dein Profil lesen (E-Mail, Vor- und Nachname, Benutzername).',
	[MCP_SCOPE_IDS.write]: 'Deinen Vornamen, Nachnamen und Benutzernamen ändern.',
	[MCP_SCOPE_IDS.eventsRead]:
		'Deine Events, Einladungen, Benachrichtigungs-Einstellungen und den Antwortstand lesen.',
	[MCP_SCOPE_IDS.eventsWrite]:
		'Events und Einladungen anlegen, pflegen und einzelne Einladungen löschen. Nicht enthalten: Events löschen oder archivieren, Links ersetzen oder für Gäste antworten.',
	// separate from events:read on purpose: a link is the whole authorization (ADR-0004), so
	// reading one means being able to answer as those guests
	[MCP_SCOPE_IDS.eventsLinks]:
		'Deine Einladungslinks auslesen. Wer einen Link hat, kann damit für die eingeladenen Gäste antworten.',
	// this grant deliberately outlives the browser session: the client keeps working after you sign
	// out of the website, until you disconnect it under Account
	[MCP_SCOPE_IDS.offline]:
		'Verbunden bleiben, auch wenn du dich auf der Website abmeldest. Ohne das musst du den Client jede Stunde neu verbinden.',
};

export function describeScope(scope: string): string {
	return MCP_SCOPE_DESCRIPTIONS[scope] ?? scope;
}

// the same scopes as a short chip for the list of connected clients, where a full sentence per
// scope is truncated away to nothing
export const MCP_SCOPE_LABELS: Record<string, string> = {
	[MCP_SCOPE_IDS.read]: 'Profil lesen',
	[MCP_SCOPE_IDS.write]: 'Profil ändern',
	[MCP_SCOPE_IDS.eventsRead]: 'Events lesen',
	[MCP_SCOPE_IDS.eventsWrite]: 'Events pflegen',
	[MCP_SCOPE_IDS.eventsLinks]: 'Einladungslinks',
	[MCP_SCOPE_IDS.offline]: 'Dauerhaft verbunden',
};

export function labelScope(scope: string): string {
	return MCP_SCOPE_LABELS[scope] ?? scope;
}

// oauth writes granted scopes as a single space-delimited string (RFC 6749 §3.3), both in the
// `scope` token claim and in the authorize request the consent screen reads. one rule, one place.
const SCOPE_SEPARATOR = ' ';

export function parseScopes(value: unknown): string[] {
	if (typeof value !== 'string') {
		return [];
	}

	return value.split(SCOPE_SEPARATOR).filter(Boolean);
}
