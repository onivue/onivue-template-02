import { MISSING_SCOPE_CODE } from '@/lib/mcp/agent-session';
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
} from '@/lib/profile/profile-schema';

type AuthClientError = {
	code?: string;
	message?: string;
	status?: number;
	statusText?: string;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
	AUTH_CANCELLED: 'Die Passkey-Anmeldung wurde abgebrochen.',
	ERROR_CEREMONY_ABORTED: 'Die Passkey-Aktion wurde abgebrochen.',
	ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED: 'Dieser Passkey ist bereits mit deinem Konto verbunden.',
	PASSKEY_NOT_FOUND: 'Dieser Passkey wurde nicht gefunden.',
	PREVIOUSLY_REGISTERED: 'Dieser Passkey ist bereits mit deinem Konto verbunden.',
	REGISTRATION_CANCELLED: 'Das Anlegen des Passkeys wurde abgebrochen.',
	SESSION_REQUIRED: 'Bitte melde dich zuerst an, bevor du einen Passkey erstellst.',
	USERNAME_IS_ALREADY_TAKEN: 'Dieser Benutzername ist bereits vergeben.',
	USERNAME_TOO_SHORT: `Der Benutzername muss mindestens ${USERNAME_MIN_LENGTH} Zeichen lang sein.`,
	USERNAME_TOO_LONG: `Der Benutzername darf höchstens ${USERNAME_MAX_LENGTH} Zeichen lang sein.`,
	INVALID_USERNAME: 'Der Benutzername enthält ungültige Zeichen oder ein unangemessenes Wort.',
	INVALID_EMAIL_OR_PASSWORD: 'E-Mail-Adresse oder Passwort ist falsch.',
	INVALID_PASSWORD: 'Das aktuelle Passwort ist falsch.',
	EMAIL_NOT_VERIFIED: 'Bitte bestätige zuerst deine E-Mail-Adresse, bevor du dich anmeldest.',
	PASSWORD_TOO_SHORT: `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`,
	PASSWORD_TOO_LONG: `Das Passwort darf höchstens ${PASSWORD_MAX_LENGTH} Zeichen lang sein.`,
	USER_ALREADY_EXISTS: 'Für diese E-Mail-Adresse existiert bereits ein Konto.',
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
		'Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte nutze eine andere Adresse.',
	CREDENTIAL_ACCOUNT_NOT_FOUND: 'Für dieses Konto ist noch kein Passwort hinterlegt.',
	INVALID_TOKEN: 'Der Link ist ungültig oder wurde bereits verwendet.',
	TOKEN_EXPIRED: 'Der Link ist abgelaufen. Bitte fordere einen neuen an.',
	SESSION_NOT_FRESH: 'Bitte melde dich erneut an, um diese Änderung vorzunehmen.',
};

// codes whose message we authored ourselves (profile-schema.ts, agent-session.ts), so it is
// already safe to show
const PASSTHROUGH_ERROR_CODES = new Set(['INVALID_FIRST_NAME', 'INVALID_LAST_NAME', MISSING_SCOPE_CODE]);

export class AuthErrorHelper {
	public getUserMessage(error: AuthClientError | null | undefined, fallback: string): string {
		if (!error) {
			return fallback;
		}

		if (error.code && PASSTHROUGH_ERROR_CODES.has(error.code) && error.message) {
			return error.message;
		}

		if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
			return AUTH_ERROR_MESSAGES[error.code];
		}

		if (error.status === 429) {
			return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
		}

		if (error.status === 401) {
			return 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
		}

		if (error.message?.toLowerCase().includes('failed to fetch')) {
			return 'Die Verbindung ist fehlgeschlagen. Bitte prüfe deine Internetverbindung.';
		}

		return fallback;
	}
}
