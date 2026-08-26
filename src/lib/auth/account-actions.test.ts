import { describe, expect, test } from 'bun:test';

import { APP_ROUTES, type AppRoute } from '@/config/routes';
import {
	AccountActions,
	type AuthGateway,
	type AuthGatewayResult,
	type SendMagicLinkParams,
} from '@/lib/auth/account-actions';

type GatewayName = keyof AuthGateway;
type GatewayOutcome = AuthGatewayResult | Error;

type Notification = {
	kind: 'error' | 'success';
	message: string;
};

function createHarness(outcomes: Partial<Record<GatewayName, GatewayOutcome>> = {}) {
	const calls: { name: GatewayName; params?: unknown }[] = [];
	const notifications: Notification[] = [];
	const navigations: AppRoute[] = [];
	let refreshCount = 0;
	let invalidateCount = 0;

	function respond(name: GatewayName) {
		return async (params?: unknown): Promise<AuthGatewayResult> => {
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
		deletePasskey: respond('deletePasskey'),
		sendMagicLink: respond('sendMagicLink'),
		signInPasskey: respond('signInPasskey'),
		signOut: respond('signOut'),
		updateProfile: respond('updateProfile'),
	};

	const actions = new AccountActions(gateway, {
		invalidate: async () => {
			invalidateCount += 1;
		},
		navigate: {
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
		calls,
		notifications,
		navigations,
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

		expect(harness.navigations).toEqual([APP_ROUTES.ACCOUNT]);
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

			expect(harness.magicLinkParams().callbackURL).toBe(APP_ROUTES.ACCOUNT);
		});
	}

	test('an internal path is preserved', async () => {
		const harness = createHarness();

		await harness.actions.sendLoginLink('du@example.com', APP_ROUTES.SETTINGS);

		expect(harness.magicLinkParams().callbackURL).toBe(APP_ROUTES.SETTINGS);
	});
});

describe('profile updates', () => {
	test('a successful update notifies success and refreshes', async () => {
		const harness = createHarness();

		const outcome = await harness.actions.updateProfile({
			firstName: 'Albin',
			lastName: 'Hoti',
			username: 'albinh',
		});

		expect(outcome).toEqual({ ok: true });
		expect(harness.notifications).toEqual([{ kind: 'success', message: 'Profil wurde aktualisiert.' }]);
		expect(harness.refreshCount).toBe(1);
		expect(harness.navigations).toEqual([]);
		expect(harness.invalidateCount).toBe(0);
	});

	test('a taken username is reported with the action fallback', async () => {
		const harness = createHarness({ updateProfile: { error: {} } });

		const outcome = await harness.actions.updateProfile({
			firstName: 'Albin',
			lastName: 'Hoti',
			username: 'albinh',
		});

		expect(outcome).toEqual({
			ok: false,
			message: 'Die Profilinformationen konnten nicht gespeichert werden.',
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
