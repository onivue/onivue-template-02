import { describe, expect, test } from 'bun:test';

import { resolveNotificationSettings } from '@/lib/events/notification-settings';

const OFF = { email: null, enabled: false } as const;
const ON = { email: 'host@example.com', enabled: true } as const;

describe('the switch and the address are resolved together', () => {
	test('switching on with an address in the same call is valid', () => {
		expect(resolveNotificationSettings(OFF, { email: 'host@example.com', enabled: true })).toEqual({
			settings: { email: 'host@example.com', enabled: true },
			valid: true,
		});
	});

	test('switching on when an address is already stored keeps that address', () => {
		expect(resolveNotificationSettings({ email: 'host@example.com', enabled: false }, { enabled: true })).toEqual({
			settings: { email: 'host@example.com', enabled: true },
			valid: true,
		});
	});

	test('switching on with nowhere to send to is refused', () => {
		expect(resolveNotificationSettings(OFF, { enabled: true })).toEqual({
			reason: 'missing-email',
			valid: false,
		});
	});

	test('clearing the address while the switch is on is refused', () => {
		expect(resolveNotificationSettings(ON, { email: '  ' })).toEqual({
			reason: 'missing-email',
			valid: false,
		});
	});

	test('clearing the address and switching off in one call is valid', () => {
		expect(resolveNotificationSettings(ON, { email: '', enabled: false })).toEqual({
			settings: { email: null, enabled: false },
			valid: true,
		});
	});

	test('a new address alone leaves the switch as it was', () => {
		expect(resolveNotificationSettings(ON, { email: ' other@example.com ' })).toEqual({
			settings: { email: 'other@example.com', enabled: true },
			valid: true,
		});
	});

	test('an empty patch changes nothing', () => {
		expect(resolveNotificationSettings(ON, {})).toEqual({ settings: ON, valid: true });
	});
});
