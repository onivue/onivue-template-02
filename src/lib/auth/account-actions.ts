import { APP_ROUTES, getAccessFor, type AppRoute } from '@/config/routes';
import { AuthErrorHelper } from '@/lib/auth/auth-error-helper';

// narrow structural port over the better-auth client, so its types stay out of callers and tests
export type AuthGatewayError = {
	code?: string;
	message?: string;
	status?: number;
	statusText?: string;
};

export type AuthGatewayResult = {
	error?: AuthGatewayError | null;
};

export type SendMagicLinkParams = {
	callbackURL: string;
	email: string;
	errorCallbackURL: string;
	name?: string;
	newUserCallbackURL: string;
};

// partial by design: username and name are saved through separate forms
export type UpdateProfileParams = {
	firstName?: string;
	lastName?: string;
	username?: string;
};

export type UpdateNameParams = {
	firstName: string;
	lastName: string;
};

export type SignInEmailParams = {
	email: string;
	password: string;
};

export type SignUpEmailParams = {
	callbackURL: string;
	email: string;
	name: string;
	password: string;
};

export type ChangePasswordParams = {
	currentPassword: string;
	newPassword: string;
};

export type RequestPasswordResetParams = {
	email: string;
	redirectTo: string;
};

export type ResetPasswordParams = {
	newPassword: string;
	token: string;
};

export type AuthGateway = {
	addPasskey(params: { name: string }): Promise<AuthGatewayResult>;
	changeEmail(params: { callbackURL: string; newEmail: string }): Promise<AuthGatewayResult>;
	changePassword(params: ChangePasswordParams): Promise<AuthGatewayResult>;
	deletePasskey(params: { id: string }): Promise<AuthGatewayResult>;
	requestPasswordReset(params: RequestPasswordResetParams): Promise<AuthGatewayResult>;
	resetPassword(params: ResetPasswordParams): Promise<AuthGatewayResult>;
	sendMagicLink(params: SendMagicLinkParams): Promise<AuthGatewayResult>;
	signInEmail(params: SignInEmailParams): Promise<AuthGatewayResult>;
	signInPasskey(): Promise<AuthGatewayResult>;
	signOut(): Promise<AuthGatewayResult>;
	signUpEmail(params: SignUpEmailParams): Promise<AuthGatewayResult>;
	updateProfile(params: UpdateProfileParams): Promise<AuthGatewayResult>;
};

export type AccountActionName =
	| 'add-passkey'
	| 'change-email'
	| 'change-password'
	| 'delete-passkey'
	| 'register'
	| 'request-password-reset'
	| 'reset-password'
	| 'send-login-link'
	| 'sign-in-passkey'
	| 'sign-in-password'
	| 'sign-out'
	| 'sign-up-password'
	| 'update-name'
	| 'update-username';

export type ActionOutcome = { ok: true } | { ok: false; message: string };

export type NotifyPort = {
	error(message: string): void;
	success(message: string): void;
};

export type NavigatePort = {
	push(route: AppRoute): void;
	refresh(): void;
};

export type InvalidatePort = () => Promise<void>;

export type AccountActionPorts = {
	invalidate: InvalidatePort;
	navigate: NavigatePort;
	notify: NotifyPort;
};

type ActionMessages = {
	failure: string;
	success: string;
};

type SuccessEffect = {
	invalidate?: boolean;
	redirect?: AppRoute;
	refresh?: boolean;
};

const EMAIL_NAME_SEPARATOR = '@';
const PROTOCOL_RELATIVE_PREFIX = '//';
const BACKSLASH_RELATIVE_PREFIX = '/\\';

// every fallback string lives here once, instead of being retyped per error channel
const ACTION_MESSAGES: Record<AccountActionName, ActionMessages> = {
	'add-passkey': {
		failure: 'Der Passkey konnte nicht erstellt werden.',
		success: 'Passkey wurde erstellt.',
	},
	'change-email': {
		failure: 'Die E-Mail-Änderung konnte nicht gestartet werden.',
		success: 'Bestätigungslink gesendet. Bitte prüfe deine aktuelle E-Mail-Adresse.',
	},
	'change-password': {
		failure: 'Das Passwort konnte nicht geändert werden.',
		success: 'Passwort wurde geändert.',
	},
	'delete-passkey': {
		failure: 'Der Passkey konnte nicht entfernt werden.',
		success: 'Passkey wurde entfernt.',
	},
	register: {
		failure: 'Der Registrierungslink konnte nicht gesendet werden. Bitte versuche es erneut.',
		success: 'Registrierungslink gesendet. Bitte öffne deine E-Mail und bestätige den Link.',
	},
	'request-password-reset': {
		failure: 'Der Link zum Zurücksetzen konnte nicht gesendet werden. Bitte versuche es erneut.',
		success: 'Falls diese E-Mail-Adresse existiert, wurde ein Link zum Zurücksetzen gesendet.',
	},
	'reset-password': {
		failure: 'Das Passwort konnte nicht gesetzt werden. Der Link ist möglicherweise abgelaufen.',
		success: 'Passwort wurde gesetzt. Du kannst dich jetzt anmelden.',
	},
	'send-login-link': {
		failure: 'Der Login-Link konnte nicht gesendet werden. Bitte versuche es erneut.',
		success: 'Login-Link gesendet. Bitte öffne deine E-Mail und bestätige den Link.',
	},
	'sign-in-passkey': {
		failure: 'Die Passkey-Anmeldung ist fehlgeschlagen.',
		success: 'Erfolgreich angemeldet.',
	},
	'sign-in-password': {
		failure: 'Die Anmeldung ist fehlgeschlagen.',
		success: 'Erfolgreich angemeldet.',
	},
	'sign-out': {
		failure: 'Abmelden ist fehlgeschlagen.',
		success: 'Du bist abgemeldet.',
	},
	'sign-up-password': {
		failure: 'Die Registrierung konnte nicht abgeschlossen werden.',
		success: 'Konto erstellt. Bitte bestätige deine E-Mail-Adresse, um dich anzumelden.',
	},
	'update-name': {
		failure: 'Der Name konnte nicht gespeichert werden.',
		success: 'Name wurde aktualisiert.',
	},
	'update-username': {
		failure: 'Der Benutzername konnte nicht gespeichert werden.',
		success: 'Benutzername wurde aktualisiert.',
	},
};

const ACTION_EFFECTS: Record<AccountActionName, SuccessEffect> = {
	'add-passkey': { invalidate: true },
	'change-email': {},
	'change-password': {},
	'delete-passkey': { invalidate: true },
	register: {},
	'request-password-reset': {},
	'reset-password': { redirect: APP_ROUTES.LOGIN },
	'send-login-link': {},
	'sign-in-passkey': { redirect: APP_ROUTES.ACCOUNT },
	'sign-in-password': { redirect: APP_ROUTES.ACCOUNT },
	'sign-out': { redirect: APP_ROUTES.LANDING },
	'sign-up-password': {},
	'update-name': { refresh: true },
	'update-username': { refresh: true },
};

function toGatewayError(error: unknown): AuthGatewayError | null {
	if (error instanceof Error) {
		return { message: error.message };
	}

	return null;
}

export class AccountActions {
	private readonly errorHelper = new AuthErrorHelper();

	public constructor(
		private readonly gateway: AuthGateway,
		private readonly ports: AccountActionPorts
	) {}

	public async sendLoginLink(email: string, requestedCallbackUrl: string | null): Promise<ActionOutcome> {
		return await this.execute(
			'send-login-link',
			async () =>
				await this.gateway.sendMagicLink({
					callbackURL: this.resolveCallbackUrl(requestedCallbackUrl),
					email,
					errorCallbackURL: APP_ROUTES.LOGIN,
					newUserCallbackURL: APP_ROUTES.ACCOUNT,
				})
		);
	}

	public async signInWithPasskey(): Promise<ActionOutcome> {
		return await this.execute('sign-in-passkey', async () => await this.gateway.signInPasskey());
	}

	public async register(email: string): Promise<ActionOutcome> {
		return await this.execute(
			'register',
			async () =>
				await this.gateway.sendMagicLink({
					callbackURL: APP_ROUTES.ACCOUNT,
					email,
					errorCallbackURL: APP_ROUTES.REGISTER,
					name: this.deriveDefaultName(email),
					newUserCallbackURL: APP_ROUTES.ACCOUNT,
				})
		);
	}

	public async addPasskey(name: string): Promise<ActionOutcome> {
		return await this.execute('add-passkey', async () => await this.gateway.addPasskey({ name }));
	}

	public async deletePasskey(id: string): Promise<ActionOutcome> {
		return await this.execute('delete-passkey', async () => await this.gateway.deletePasskey({ id }));
	}

	public async changeEmail(newEmail: string): Promise<ActionOutcome> {
		return await this.execute(
			'change-email',
			async () =>
				await this.gateway.changeEmail({
					callbackURL: APP_ROUTES.ACCOUNT,
					newEmail,
				})
		);
	}

	public async signOut(): Promise<ActionOutcome> {
		return await this.execute('sign-out', async () => await this.gateway.signOut());
	}

	public async signInWithPassword(email: string, password: string): Promise<ActionOutcome> {
		return await this.execute('sign-in-password', async () => await this.gateway.signInEmail({ email, password }));
	}

	public async signUpWithPassword(email: string, password: string): Promise<ActionOutcome> {
		return await this.execute(
			'sign-up-password',
			async () =>
				await this.gateway.signUpEmail({
					callbackURL: APP_ROUTES.LOGIN,
					email,
					name: this.deriveDefaultName(email),
					password,
				})
		);
	}

	public async changePassword(currentPassword: string, newPassword: string): Promise<ActionOutcome> {
		return await this.execute(
			'change-password',
			async () => await this.gateway.changePassword({ currentPassword, newPassword })
		);
	}

	public async requestPasswordReset(email: string): Promise<ActionOutcome> {
		return await this.execute(
			'request-password-reset',
			async () =>
				await this.gateway.requestPasswordReset({
					email,
					redirectTo: APP_ROUTES.RESET_PASSWORD,
				})
		);
	}

	public async resetPassword(newPassword: string, token: string): Promise<ActionOutcome> {
		return await this.execute(
			'reset-password',
			async () => await this.gateway.resetPassword({ newPassword, token })
		);
	}

	public async updateUsername(username: string): Promise<ActionOutcome> {
		return await this.execute('update-username', async () => await this.gateway.updateProfile({ username }));
	}

	public async updateName(params: UpdateNameParams): Promise<ActionOutcome> {
		return await this.execute('update-name', async () => await this.gateway.updateProfile(params));
	}

	// the single ritual: both error channels normalise here, and success effects are declarative
	private async execute(
		action: AccountActionName,
		operation: () => Promise<AuthGatewayResult>
	): Promise<ActionOutcome> {
		const { failure, success } = ACTION_MESSAGES[action];

		try {
			const { error } = await operation();

			if (error) {
				return this.fail(failure, error);
			}
		} catch (error) {
			return this.fail(failure, toGatewayError(error));
		}

		this.ports.notify.success(success);
		await this.applySuccessEffect(action);

		return { ok: true };
	}

	private fail(fallback: string, error: AuthGatewayError | null): ActionOutcome {
		const message = this.errorHelper.getUserMessage(error, fallback);
		this.ports.notify.error(message);

		return { ok: false, message };
	}

	private async applySuccessEffect(action: AccountActionName): Promise<void> {
		const effect = ACTION_EFFECTS[action];

		if (effect.invalidate) {
			await this.ports.invalidate();
		}

		if (effect.refresh) {
			this.ports.navigate.refresh();
		}

		if (!effect.redirect) {
			return;
		}

		this.ports.navigate.push(effect.redirect);
		this.ports.navigate.refresh();
	}

	// rejects open redirects and bounces back to auth pages
	private resolveCallbackUrl(requested: string | null): string {
		if (!requested?.startsWith('/')) {
			return APP_ROUTES.ACCOUNT;
		}

		if (requested.startsWith(PROTOCOL_RELATIVE_PREFIX) || requested.startsWith(BACKSLASH_RELATIVE_PREFIX)) {
			return APP_ROUTES.ACCOUNT;
		}

		// bouncing a signed-in viewer back to an auth page would immediately redirect again
		if (getAccessFor(requested) === 'guest') {
			return APP_ROUTES.ACCOUNT;
		}

		return requested;
	}

	private deriveDefaultName(email: string): string {
		const [name] = email.split(EMAIL_NAME_SEPARATOR);
		const trimmedName = name?.trim();

		if (!trimmedName) {
			return email;
		}

		return trimmedName;
	}
}
