export type AuthEmailKind = 'email-change' | 'email-verification' | 'magic-link' | 'password-reset';

export type AuthEmail = {
	kind: AuthEmailKind;
	to: string;
	url: string;
};

export type EmailResult = { success: true } | { success: false; error: { message: string } };

// one method; the message kind is data, so the interface stops growing per template
export type EmailGateway = {
	send(message: AuthEmail): Promise<EmailResult>;
};

type EmailTemplate = {
	previewText: string;
	subject: string;
};

const EMAIL_TEMPLATES: Record<AuthEmailKind, EmailTemplate> = {
	'email-change': {
		previewText: 'Bestätige die Änderung deiner E-Mail-Adresse.',
		subject: 'E-Mail-Adresse für onivue ändern',
	},
	'email-verification': {
		previewText: 'Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.',
		subject: 'Bestätige deine E-Mail-Adresse für onivue',
	},
	'magic-link': {
		previewText: 'Dein Login-Link ist 15 Minuten gültig.',
		subject: 'Dein Login-Link für onivue',
	},
	'password-reset': {
		previewText: 'Setze dein Passwort für onivue zurück. Der Link ist 30 Minuten gültig.',
		subject: 'Passwort zurücksetzen für onivue',
	},
};

const EMAIL_LINK_STYLE =
	'display:inline-block;border-radius:999px;background:#14151a;color:#d6ff42;font-weight:700;padding:14px 18px;text-decoration:none;';

const HTML_ESCAPES: Record<string, string> = {
	'"': '&quot;',
	'&': '&amp;',
	"'": '&#39;',
	'<': '&lt;',
	'>': '&gt;',
};

function escapeHtml(value: string): string {
	return value.replaceAll(/["&'<>]/g, (character) => HTML_ESCAPES[character] ?? character);
}

export function renderAuthEmail(message: AuthEmail): { html: string; subject: string; text: string } {
	const { previewText, subject } = EMAIL_TEMPLATES[message.kind];
	const href = escapeHtml(message.url);

	return {
		html: `
			<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14151a;">
				<p>${previewText}</p>
				<p><a href="${href}" target="_blank" rel="noopener noreferrer" style="${EMAIL_LINK_STYLE}">Weiter zu onivue</a></p>
				<p style="color:#687078;font-size:13px;">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
			</div>
		`,
		subject,
		text: `${previewText}\n\n${message.url}`,
	};
}
