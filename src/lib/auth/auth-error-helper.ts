import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/lib/profile/profile-schema';

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
};

// codes whose message we authored ourselves (profile-schema.ts), so it is already safe to show
const PASSTHROUGH_ERROR_CODES = new Set(['INVALID_FIRST_NAME', 'INVALID_LAST_NAME']);

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
