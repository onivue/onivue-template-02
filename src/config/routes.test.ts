import { describe, expect, test } from 'bun:test';

import { APP_ROUTES, NAVIGATION_ROUTES, getAccessFor, getSignedInRedirectFor, matchesRoute } from '@/config/routes';

describe('route matching', () => {
	test('an exact path matches', () => {
		expect(matchesRoute('/settings', '/settings')).toBe(true);
	});

	test('a nested path matches its parent route', () => {
		expect(matchesRoute('/settings/security', '/settings')).toBe(true);
	});

	test('a path that merely shares a prefix does not match', () => {
		expect(matchesRoute('/setting', '/settings')).toBe(false);
	});

	test('the root route matches only itself', () => {
		expect(matchesRoute('/', '/')).toBe(true);
		expect(matchesRoute('/settings', '/')).toBe(false);
		expect(matchesRoute('/events', '/')).toBe(false);
	});
});

describe('access classification', () => {
	test('the landing page is guest-only, so a signed-in reader never sees it', () => {
		expect(getAccessFor(APP_ROUTES.HOME)).toBe('guest');
	});

	test('the auth pages are guest-only', () => {
		expect(getAccessFor(APP_ROUTES.LOGIN)).toBe('guest');
		expect(getAccessFor(APP_ROUTES.REGISTER)).toBe('guest');
	});

	test('the guest link is public, so a guest needs no account', () => {
		expect(getAccessFor(APP_ROUTES.INVITATION)).toBe('public');
		expect(getAccessFor('/i/abc123')).toBe('public');
	});

	test('events, settings and consent need a viewer', () => {
		expect(getAccessFor(APP_ROUTES.EVENTS)).toBe('viewer');
		expect(getAccessFor('/events/ev-1/guests')).toBe('viewer');
		expect(getAccessFor(APP_ROUTES.SETTINGS)).toBe('viewer');
		expect(getAccessFor(APP_ROUTES.CONSENT)).toBe('viewer');
	});

	test('a nested path inherits its route access', () => {
		expect(getAccessFor('/settings/security')).toBe('viewer');
		expect(getAccessFor('/i/abc123/calendar')).toBe('public');
	});

	test('an unknown path denies by default', () => {
		expect(getAccessFor('/not-a-route')).toBe('viewer');
	});
});

describe('signed-in redirects', () => {
	test('the landing page hands a signed-in reader to the events list', () => {
		expect(getSignedInRedirectFor(APP_ROUTES.HOME)).toBe(APP_ROUTES.EVENTS);
	});

	test('the auth pages keep handing them to their profile', () => {
		expect(getSignedInRedirectFor(APP_ROUTES.LOGIN)).toBe(APP_ROUTES.SETTINGS_PROFILE);
		expect(getSignedInRedirectFor(APP_ROUTES.REGISTER)).toBe(APP_ROUTES.SETTINGS_PROFILE);
	});
});

describe('navigation routes', () => {
	test('order is events, settings', () => {
		expect(NAVIGATION_ROUTES.map((route) => route.name)).toEqual(['EVENTS', 'SETTINGS']);
	});

	test('every navigation route carries a label and a test id', () => {
		for (const route of NAVIGATION_ROUTES) {
			expect(route.label.length).toBeGreaterThan(0);
			expect(route.testId.length).toBeGreaterThan(0);
		}
	});
});

describe('metadata files', () => {
	test('a preview image is reachable without a session, wherever it sits', () => {
		expect(getAccessFor('/opengraph-image')).toBe('public');
		expect(getAccessFor('/twitter-image')).toBe('public');
		expect(getAccessFor('/icon')).toBe('public');
		expect(getAccessFor('/apple-icon')).toBe('public');
		// generateImageMetadata numbers its output
		expect(getAccessFor('/opengraph-image-2')).toBe('public');
	});

	test('a route that merely ends in something similar stays behind the session', () => {
		expect(getAccessFor('/events/my-opengraph-image-editor')).toBe('viewer');
		expect(getAccessFor('/opengraph-images')).toBe('viewer');
	});
});
