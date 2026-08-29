import { describe, expect, test } from 'bun:test';

import { APP_ROUTES, NAVIGATION_ROUTES, getAccessFor, matchesRoute } from '@/config/routes';

describe('route matching', () => {
	test('an exact path matches', () => {
		expect(matchesRoute('/account', '/account')).toBe(true);
	});

	test('a nested path matches its parent route', () => {
		expect(matchesRoute('/account/passkeys', '/account')).toBe(true);
	});

	test('a path that merely shares a prefix does not match', () => {
		expect(matchesRoute('/accounts', '/account')).toBe(false);
	});

	test('the root route matches only itself', () => {
		expect(matchesRoute('/', '/')).toBe(true);
		expect(matchesRoute('/settings', '/')).toBe(false);
		expect(matchesRoute('/landing', '/')).toBe(false);
	});
});

describe('access classification', () => {
	test('landing is public', () => {
		expect(getAccessFor(APP_ROUTES.LANDING)).toBe('public');
	});

	test('the auth pages are guest-only', () => {
		expect(getAccessFor(APP_ROUTES.LOGIN)).toBe('guest');
		expect(getAccessFor(APP_ROUTES.REGISTER)).toBe('guest');
	});

	test('the guest link is public, so a guest needs no account', () => {
		expect(getAccessFor(APP_ROUTES.INVITATION)).toBe('public');
		expect(getAccessFor('/i/abc123')).toBe('public');
	});

	test('home, events, account, settings and consent need a viewer', () => {
		expect(getAccessFor(APP_ROUTES.HOME)).toBe('viewer');
		expect(getAccessFor(APP_ROUTES.EVENTS)).toBe('viewer');
		expect(getAccessFor('/events/ev-1/guests')).toBe('viewer');
		expect(getAccessFor(APP_ROUTES.ACCOUNT)).toBe('viewer');
		expect(getAccessFor(APP_ROUTES.SETTINGS)).toBe('viewer');
		expect(getAccessFor(APP_ROUTES.CONSENT)).toBe('viewer');
	});

	test('a nested path inherits its route access', () => {
		expect(getAccessFor('/account/passkeys')).toBe('viewer');
		expect(getAccessFor('/landing/pricing')).toBe('public');
	});

	test('an unknown path denies by default', () => {
		expect(getAccessFor('/not-a-route')).toBe('viewer');
	});
});

describe('navigation routes', () => {
	test('order is events, account, settings', () => {
		expect(NAVIGATION_ROUTES.map((route) => route.name)).toEqual(['EVENTS', 'ACCOUNT', 'SETTINGS']);
	});

	test('every navigation route carries a label and a test id', () => {
		for (const route of NAVIGATION_ROUTES) {
			expect(route.label.length).toBeGreaterThan(0);
			expect(route.testId.length).toBeGreaterThan(0);
		}
	});
});
