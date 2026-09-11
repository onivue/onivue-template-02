import { describe, expect, test } from 'bun:test';

import { APP_ROUTES, type AppRoute } from '@/config/routes';
import {
	AccountActions,
	type AccountActionName,
	type AuthGateway,
	type AuthGatewayResult,
	type ConsentDecisionData,
	type SendMagicLinkParams,
} from '@/lib/auth/account-actions';

type GatewayName = keyof AuthGateway;
// the widest payload any port member carries, so one fake responder covers them all
type GatewayResult = AuthGatewayResult<ConsentDecisionData>;
type GatewayOutcome = GatewayResult | Error;

type Notification = {
	kind: 'error' | 'success';
	message: string;
};

type BusyEvent = { kind: 'finish' } | { kind: 'start'; action: AccountActionName; targetId?: string };

function createHarness(outcomes: Partial<Record<GatewayName, GatewayOutcome>> = {}) {
	const calls: { name: GatewayName; params?: unknown }[] = [];
	const notifications: Notification[] = [];
	const navigations: AppRoute[] = [];
	const externalNavigations: string[] = [];
	const busyEvents: BusyEvent[] = [];
	let refreshCount = 0;
	let invalidateCount = 0;

	function respond(name: GatewayName) {
		return async (params?: unknown): Promise<GatewayResult> => {
			calls.push({ name, params });
			const outcome = outcomes[name];

			if (outcome instanceof Error) {
				throw outcome;
			}

			return outcome ?? {};
		};
	}

	const gateway: AuthGateway = {
		addPasskey: respond('addPasskey'),
		changeEmail: respond('changeEmail'),
		changePassword: respond('changePassword'),
		decideConsent: respond('decideConsent'),
		deletePasskey: respond('deletePasskey'),
		revokeConnection: respond('revokeConnection'),
		requestPasswordReset: respond('requestPasswordReset'),
		resetPassword: respond('resetPassword'),
		sendMagicLink: respond('sendMagicLink'),
		signInEmail: respond('signInEmail'),
		signInPasskey: respond('signInPasskey'),
		signOut: respond('signOut'),
		signUpEmail: respond('signUpEmail'),
		updateProfile: respond('updateProfile'),
	};

	const actions = new AccountActions(gateway, {
		busy: {
			finish: () => busyEvents.push({ kind: 'finish' }),
			start: (action, targetId) => busyEvents.push({ kind: 'start', action, targetId }),
		},
		invalidate: async () => {
			invalidateCount += 1;
		},
		navigate: {
			external: (url) => externalNavigations.push(url),
			push: (route) => navigations.push(route),
			refresh: () => {
				refreshCount += 1;
			},
		},
		notify: {
			error: (message) => notifications.push({ kind: 'error', message }),
			success: (message) => notifications.push({ kind: 'success', message }),
		},
	});

	return {
		actions,
		busyEvents,
		calls,
		notifications,
		navigations,
		externalNavigations,
		get refreshCount() {
			return refreshCount;
		},
		get invalidateCount() {
			return invalidateCount;
		},
		magicLinkParams: (): SendMagicLinkParams =>
			calls.find((call) => call.name === 'sendMagicLink')?.params as SendMagicLinkParams,
	};
}

describe('both error channels produce the same copy', () => {
	test('a returned error is reported with the action fallback', async () => {
		const harness = createHarness({ sendMagicLink: { error: {} } });

		const outcome = await harness.actions.sendLoginLink('du@example.com', null);

		expect(outcome).toEqual({
			ok: false,
			message: 'Der Login-Link konnte nicht gesendet werden. Bitte versuche es erneut.',
		});
		expect(harness.notifications).toEqual([
			{ kind: 'error', message: 'Der Login-Link konnte nicht gesendet werden. Bitte versuche es erneut.' },
		]);
	});

	test('a thrown error is reported with the identical fallback', async () => {
		const harness = createHarness({ sendMagicLink: new Error('socket hang up') });

		const outcome = await harness.actions.sendLoginLink('du@example.com', null);

		expect(outcome).toEqual({
			ok: false,
			message: 'Der Login-Link konnte nicht gesendet werden. Bitte versuche es erneut.',
		});
	});

	test('a known error code beats the fallback', async () => {
		const harness = createHarness({ signInPasskey: { error: { code: 'PASSKEY_NOT_FOUND' } } });

		const outcome = await harness.actions.signInWithPasskey();

		expect(outcome).toEqual({ ok: false, message: 'Dieser Passkey wurde nicht gefunden.' });
	});

	test('a rate-limited response gets the rate-limit copy', async () => {
		const harness = createHarness({ addPasskey: { error: { status: 429 } } });

		const outcome = await harness.actions.addPasskey('Mein Passkey');

		expect(outcome).toEqual({ ok: false, message: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.' });
	});

	test('a failure fires no success effects', async () => {
		const harness = createHarness({ signOut: new Error('offline') });

		await harness.actions.signOut();

		expect(harness.navigations).toEqual([]);
		expect(harness.refreshCount).toBe(0);
		expect(harness.notifications.every((entry) => entry.kind === 'error')).toBe(true);
	});
});

describe('success effects are applied per action', () => {
	test('sign-out lands on landing and refreshes', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.signOut();

		expect(outcome).toEqual({ ok: true });
		expect(harness.navigations).toEqual([APP_ROUTES.LANDING]);
		expect(harness.refreshCount).toBe(1);
	});

	test('passkey sign-in lands on account and refreshes', async () => {
		const harness = createHarness();

		await harness.actions.signInWithPasskey();

		expect(harness.navigations).toEqual([APP_ROUTES.SETTINGS_PROFILE]);
		expect(harness.refreshCount).toBe(1);
	});

	test('passkey mutations invalidate the list', async () => {
		const added = createHarness();
		await added.actions.addPasskey('Mein Passkey');

		const deleted = createHarness();
		await deleted.actions.deletePasskey('passkey-1');

		expect(added.invalidateCount).toBe(1);
		expect(deleted.invalidateCount).toBe(1);
	});

	test('email change neither navigates nor invalidates', async () => {
		const harness = createHarness();

		await harness.actions.changeEmail('neu@example.com');

		expect(harness.navigations).toEqual([]);
		expect(harness.invalidateCount).toBe(0);
		expect(harness.notifications).toEqual([
			{ kind: 'success', message: 'Bestätigungslink gesendet. Bitte prüfe deine aktuelle E-Mail-Adresse.' },
		]);
	});
});

describe('callback urls cannot leave the app', () => {
	const rejected = [
		['a protocol-relative url', '//evil.com'],
		['a backslash-relative url', '/\\evil.com'],
		['an absolute url', 'https://evil.com'],
		['the login page itself', APP_ROUTES.LOGIN],
		['the register page', APP_ROUTES.REGISTER],
		['a missing value', null],
	] as const;

	for (const [label, callbackUrl] of rejected) {
		test(`${label} falls back to the account route`, async () => {
			const harness = createHarness();

			await harness.actions.sendLoginLink('du@example.com', callbackUrl);

			expect(harness.magicLinkParams().callbackURL).toBe(APP_ROUTES.SETTINGS_PROFILE);
		});
	}

	test('an internal path is preserved', async () => {
		const harness = createHarness();

		await harness.actions.sendLoginLink('du@example.com', APP_ROUTES.SETTINGS);

		expect(harness.magicLinkParams().callbackURL).toBe(APP_ROUTES.SETTINGS);
	});
});

describe('profile updates', () => {
	test('a successful username update notifies success and refreshes', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.updateUsername('albinh');

		expect(outcome).toEqual({ ok: true });
		expect(harness.notifications).toEqual([{ kind: 'success', message: 'Benutzername wurde aktualisiert.' }]);
		expect(harness.refreshCount).toBe(1);
		expect(harness.navigations).toEqual([]);
		expect(harness.invalidateCount).toBe(0);
	});

	test('a successful name update notifies success and refreshes', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.updateName({ firstName: 'Albin', lastName: 'Hoti' });

		expect(outcome).toEqual({ ok: true });
		expect(harness.notifications).toEqual([{ kind: 'success', message: 'Name wurde aktualisiert.' }]);
		expect(harness.refreshCount).toBe(1);
	});

	test('the username is sent without touching the name fields', async () => {
		const harness = createHarness();

		await harness.actions.updateUsername('albinh');

		expect(harness.calls.find((call) => call.name === 'updateProfile')?.params).toEqual({ username: 'albinh' });
	});

	test('the name is sent without touching the username', async () => {
		const harness = createHarness();

		await harness.actions.updateName({ firstName: 'Albin', lastName: 'Hoti' });

		expect(harness.calls.find((call) => call.name === 'updateProfile')?.params).toEqual({
			firstName: 'Albin',
			lastName: 'Hoti',
		});
	});

	test('a taken username is reported with the action fallback', async () => {
		const harness = createHarness({ updateProfile: { error: {} } });

		const outcome = await harness.actions.updateUsername('albinh');

		expect(outcome).toEqual({
			ok: false,
			message: 'Der Benutzername konnte nicht gespeichert werden.',
		});
	});
});

describe('registration derives a default name', () => {
	test('the local part of the address becomes the name', async () => {
		const harness = createHarness();

		await harness.actions.register('albin@example.com');

		expect(harness.magicLinkParams().name).toBe('albin');
	});

	test('an address with no local part falls back to the address', async () => {
		const harness = createHarness();

		await harness.actions.register('@example.com');

		expect(harness.magicLinkParams().name).toBe('@example.com');
	});
});

describe('password authentication', () => {
	test('a successful sign-in redirects to account and refreshes', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.signInWithPassword('du@example.com', 'correct-horse-battery');

		expect(outcome).toEqual({ ok: true });
		expect(harness.calls.find((call) => call.name === 'signInEmail')?.params).toEqual({
			email: 'du@example.com',
			password: 'correct-horse-battery',
		});
		expect(harness.navigations).toEqual([APP_ROUTES.SETTINGS_PROFILE]);
		expect(harness.refreshCount).toBe(1);
	});

	test('an invalid password is reported with a known error code', async () => {
		const harness = createHarness({ signInEmail: { error: { code: 'INVALID_EMAIL_OR_PASSWORD' } } });

		const outcome = await harness.actions.signInWithPassword('du@example.com', 'wrong-password');

		expect(outcome).toEqual({ ok: false, message: 'E-Mail-Adresse oder Passwort ist falsch.' });
	});

	test('sign-up derives a default name and does not navigate', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.signUpWithPassword('albin@example.com', 'correct-horse-battery');

		expect(outcome).toEqual({ ok: true });
		expect(harness.calls.find((call) => call.name === 'signUpEmail')?.params).toEqual({
			callbackURL: APP_ROUTES.LOGIN,
			email: 'albin@example.com',
			name: 'albin',
			password: 'correct-horse-battery',
		});
		expect(harness.navigations).toEqual([]);
	});

	test('a duplicate sign-up is reported with a known error code', async () => {
		const harness = createHarness({ signUpEmail: { error: { code: 'USER_ALREADY_EXISTS' } } });

		const outcome = await harness.actions.signUpWithPassword('du@example.com', 'correct-horse-battery');

		expect(outcome).toEqual({ ok: false, message: 'Für diese E-Mail-Adresse existiert bereits ein Konto.' });
	});

	test('changing the password neither navigates nor invalidates', async () => {
		const harness = createHarness();

		await harness.actions.changePassword('old-password', 'new-password');

		expect(harness.calls.find((call) => call.name === 'changePassword')?.params).toEqual({
			currentPassword: 'old-password',
			newPassword: 'new-password',
		});
		expect(harness.navigations).toEqual([]);
		expect(harness.invalidateCount).toBe(0);
	});

	test('requesting a reset link targets the reset-password route', async () => {
		const harness = createHarness();

		await harness.actions.requestPasswordReset('du@example.com');

		expect(harness.calls.find((call) => call.name === 'requestPasswordReset')?.params).toEqual({
			email: 'du@example.com',
			redirectTo: APP_ROUTES.RESET_PASSWORD,
		});
	});

	test('resetting the password redirects to login', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.resetPassword('new-password', 'a-token');

		expect(outcome).toEqual({ ok: true });
		expect(harness.calls.find((call) => call.name === 'resetPassword')?.params).toEqual({
			newPassword: 'new-password',
			token: 'a-token',
		});
		expect(harness.navigations).toEqual([APP_ROUTES.LOGIN]);
	});

	test('an expired reset token is reported with a known error code', async () => {
		const harness = createHarness({ resetPassword: { error: { code: 'INVALID_TOKEN' } } });

		const outcome = await harness.actions.resetPassword('new-password', 'a-token');

		expect(outcome).toEqual({ ok: false, message: 'Der Link ist ungültig oder wurde bereits verwendet.' });
	});
});

describe('busy state is raised and cleared by the module', () => {
	test('a successful action starts busy and finishes it', async () => {
		const harness = createHarness();

		await harness.actions.signOut();

		expect(harness.busyEvents).toEqual([
			{ kind: 'start', action: 'sign-out', targetId: undefined },
			{ kind: 'finish' },
		]);
	});

	test('a failing action still clears busy', async () => {
		const harness = createHarness({ signOut: new Error('offline') });

		await harness.actions.signOut();

		expect(harness.busyEvents.at(-1)).toEqual({ kind: 'finish' });
	});

	test('busy is cleared only after the success effects have run', async () => {
		const harness = createHarness();

		await harness.actions.signOut();

		// the redirect is fired while still busy, so nothing can be clicked in between
		expect(harness.navigations).toEqual([APP_ROUTES.LANDING]);
		expect(harness.busyEvents.at(-1)).toEqual({ kind: 'finish' });
	});

	test('per-row actions carry the id they are running against', async () => {
		const harness = createHarness();

		await harness.actions.deletePasskey('passkey-1');

		expect(harness.busyEvents[0]).toEqual({ kind: 'start', action: 'delete-passkey', targetId: 'passkey-1' });
	});
});

describe('disconnecting an mcp client', () => {
	test('a successful revocation notifies and refreshes', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.revokeConnection('consent-1', 'client-abc');

		expect(outcome).toEqual({ ok: true });
		expect(harness.notifications).toEqual([{ kind: 'success', message: 'Client wurde getrennt.' }]);
		expect(harness.refreshCount).toBe(1);
		expect(harness.navigations).toEqual([]);
	});

	test('both ids reach the gateway', async () => {
		const harness = createHarness();

		await harness.actions.revokeConnection('consent-1', 'client-abc');

		expect(harness.calls.find((call) => call.name === 'revokeConnection')?.params).toEqual({
			clientId: 'client-abc',
			consentId: 'consent-1',
		});
	});

	test('the consent id is the busy target, so one row spins at a time', async () => {
		const harness = createHarness();

		await harness.actions.revokeConnection('consent-1', 'client-abc');

		expect(harness.busyEvents[0]).toEqual({
			kind: 'start',
			action: 'revoke-connection',
			targetId: 'consent-1',
		});
	});

	test('a failed revocation is reported and nothing refreshes', async () => {
		const harness = createHarness({ revokeConnection: { error: {} } });

		const outcome = await harness.actions.revokeConnection('consent-1', 'client-abc');

		expect(outcome).toEqual({ ok: false, message: 'Die Verbindung konnte nicht getrennt werden.' });
		expect(harness.refreshCount).toBe(0);
	});
});

describe('deciding on a consent request', () => {
	const OAUTH_QUERY = 'client_id=abc&scope=profile%3Aread&ba_param=one&ba_param=two';

	test('accepting sends the query back byte-for-byte', async () => {
		const harness = createHarness();

		await harness.actions.decideConsent(true, OAUTH_QUERY);

		expect(harness.calls.find((call) => call.name === 'decideConsent')?.params).toEqual({
			accept: true,
			oauthQuery: OAUTH_QUERY,
		});
	});

	test('accepting and denying report different copy', async () => {
		const accepted = createHarness();
		await accepted.actions.decideConsent(true, OAUTH_QUERY);

		const denied = createHarness();
		await denied.actions.decideConsent(false, OAUTH_QUERY);

		expect(accepted.notifications).toEqual([{ kind: 'success', message: 'Zugriff erlaubt.' }]);
		expect(denied.notifications).toEqual([{ kind: 'success', message: 'Zugriff abgelehnt.' }]);
	});

	test('the provider’s redirect target is followed out of the app', async () => {
		const harness = createHarness({
			decideConsent: { data: { url: 'https://client.example/callback?code=xyz' } },
		});

		await harness.actions.decideConsent(true, OAUTH_QUERY);

		expect(harness.externalNavigations).toEqual(['https://client.example/callback?code=xyz']);
		expect(harness.navigations).toEqual([]);
	});

	test('no redirect target means no navigation', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.decideConsent(true, OAUTH_QUERY);

		expect(outcome).toEqual({ ok: true });
		expect(harness.externalNavigations).toEqual([]);
	});

	test('a failed decision navigates nowhere', async () => {
		const harness = createHarness({ decideConsent: { error: { message: 'signature mismatch' } } });

		const outcome = await harness.actions.decideConsent(true, OAUTH_QUERY);

		expect(outcome).toEqual({ ok: false, message: 'Die Entscheidung konnte nicht gespeichert werden.' });
		expect(harness.externalNavigations).toEqual([]);
	});
});
