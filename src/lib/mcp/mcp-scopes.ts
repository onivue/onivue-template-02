// scope ids and their descriptions, kept free of server config so client components can import them

export const MCP_SCOPE_IDS = {
	read: 'profile:read',
	write: 'profile:write',
} as const;

// every scope a client may request, in the order shown on the consent screen
export const MCP_SCOPES = [MCP_SCOPE_IDS.read, MCP_SCOPE_IDS.write] as const;

// what each scope means, in plain German, for the consent screen
export const MCP_SCOPE_DESCRIPTIONS: Record<string, string> = {
	[MCP_SCOPE_IDS.read]: 'Dein Profil lesen (E-Mail, Vor- und Nachname, Benutzername).',
	[MCP_SCOPE_IDS.write]: 'Deinen Vornamen, Nachnamen und Benutzernamen ändern.',
	openid: 'Deine Identität bestätigen.',
	profile: 'Deine Profildaten lesen.',
	email: 'Deine E-Mail-Adresse lesen.',
	offline_access: 'Zugriff behalten, auch wenn du gerade nicht aktiv bist.',
};

export function describeScope(scope: string): string {
	return MCP_SCOPE_DESCRIPTIONS[scope] ?? scope;
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
