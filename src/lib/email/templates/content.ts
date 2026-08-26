import type { AuthEmailKind } from '@/lib/email/email-gateway';

export type AuthEmailContent = {
	body: string;
	ctaLabel: string;
	eyebrow: string;
	heading: string;
	linkFallbackLabel: string;
	previewText: string;
	subject: string;
};

export const AUTH_EMAIL_CONTENT: Record<AuthEmailKind, AuthEmailContent> = {
	'email-change': {
		body: 'Für dein onivue-Konto wurde eine neue E-Mail-Adresse hinterlegt. Bestätige die Änderung über den folgenden Button.',
		ctaLabel: 'Änderung bestätigen',
		eyebrow: 'E-Mail ändern',
		heading: 'Bestätige deine neue E-Mail-Adresse',
		linkFallbackLabel: 'Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:',
		previewText: 'Bestätige die Änderung deiner E-Mail-Adresse.',
		subject: 'E-Mail-Adresse für onivue ändern',
	},
	'email-verification': {
		body: 'Bitte bestätige deine E-Mail-Adresse, um dein Konto bei onivue zu aktivieren.',
		ctaLabel: 'E-Mail-Adresse bestätigen',
		eyebrow: 'Konto aktivieren',
		heading: 'Bestätige deine E-Mail-Adresse',
		linkFallbackLabel: 'Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:',
		previewText: 'Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.',
		subject: 'Bestätige deine E-Mail-Adresse für onivue',
	},
	'magic-link': {
		body: 'Klicke auf den Button, um dich bei onivue anzumelden. Der Link ist 15 Minuten gültig.',
		ctaLabel: 'Jetzt einloggen',
		eyebrow: 'Anmeldung',
		heading: 'Dein Login-Link für onivue',
		linkFallbackLabel: 'Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:',
		previewText: 'Dein Login-Link ist 15 Minuten gültig.',
		subject: 'Dein Login-Link für onivue',
	},
	'password-reset': {
		body: 'Klicke auf den Button, um ein neues Passwort für dein onivue-Konto zu vergeben. Der Link ist 30 Minuten gültig.',
		ctaLabel: 'Passwort zurücksetzen',
		eyebrow: 'Passwort zurücksetzen',
		heading: 'Setze dein Passwort zurück',
		linkFallbackLabel: 'Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:',
		previewText: 'Setze dein Passwort für onivue zurück. Der Link ist 30 Minuten gültig.',
		subject: 'Passwort zurücksetzen für onivue',
	},
};
