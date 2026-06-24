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
};

export class AuthErrorHelper {
	public getUserMessage(error: AuthClientError | null | undefined, fallback: string): string {
		if (!error) {
			return fallback;
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

export const authErrorHelper = new AuthErrorHelper();
