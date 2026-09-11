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

		expect(items.map((item) => item.label)).toEqual(['Events', 'Settings']);
		expect(items.every((item) => typeof item.icon === 'function' || typeof item.icon === 'object')).toBe(true);
	});

	test('exactly one item is active on a navigation route', () => {
		expect(activeHrefs(APP_ROUTES.SETTINGS)).toEqual([APP_ROUTES.SETTINGS]);
	});

	test('events stays active on its detail pages', () => {
		expect(activeHrefs(APP_ROUTES.EVENTS)).toEqual([APP_ROUTES.EVENTS]);
		expect(activeHrefs('/events/ev-1/guests')).toEqual([APP_ROUTES.EVENTS]);
		expect(activeHrefs(APP_ROUTES.SETTINGS)).not.toContain(APP_ROUTES.EVENTS);
	});

	test('a nested settings path keeps its parent item active', () => {
		expect(activeHrefs('/settings/security')).toEqual([APP_ROUTES.SETTINGS]);
	});

	test('a path outside the navigation leaves every item inactive', () => {
		expect(activeHrefs(APP_ROUTES.LOGIN)).toEqual([]);
	});
});
