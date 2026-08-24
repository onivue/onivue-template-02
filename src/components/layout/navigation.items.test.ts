import { describe, expect, test } from 'bun:test';

import { resolveNavigationItems } from '@/components/layout/navigation.items';
import { APP_ROUTES } from '@/config/routes';

function activeHrefs(pathname: string): string[] {
	return resolveNavigationItems(pathname)
		.filter((item) => item.isActive)
		.map((item) => item.href);
}

describe('navigation item resolution', () => {
	test('every registry route is resolved, in order, with an icon', () => {
		const items = resolveNavigationItems(APP_ROUTES.HOME);

		expect(items.map((item) => item.label)).toEqual(['Home', 'Account', 'Settings']);
		expect(items.every((item) => typeof item.icon === 'function' || typeof item.icon === 'object')).toBe(true);
	});

	test('exactly one item is active on a navigation route', () => {
		expect(activeHrefs(APP_ROUTES.ACCOUNT)).toEqual([APP_ROUTES.ACCOUNT]);
		expect(activeHrefs(APP_ROUTES.SETTINGS)).toEqual([APP_ROUTES.SETTINGS]);
	});

	test('home is active only at the root, not on every path', () => {
		expect(activeHrefs(APP_ROUTES.HOME)).toEqual([APP_ROUTES.HOME]);
		expect(activeHrefs(APP_ROUTES.SETTINGS)).not.toContain(APP_ROUTES.HOME);
	});

	test('a nested path keeps its parent item active', () => {
		expect(activeHrefs('/account/passkeys')).toEqual([APP_ROUTES.ACCOUNT]);
	});

	test('a path outside the navigation leaves every item inactive', () => {
		expect(activeHrefs(APP_ROUTES.LOGIN)).toEqual([]);
	});
});
