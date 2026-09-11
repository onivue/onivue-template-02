import { describe, expect, test } from 'bun:test';

import { resolveResponseMood } from '@/lib/events/response-mood';

describe('resolveResponseMood', () => {
	test('stays silent while nothing has been saved', () => {
		expect(resolveResponseMood({ isAnswered: false, isAttending: false })).toBeNull();
		expect(resolveResponseMood({ isAnswered: false, isAttending: true })).toBeNull();
	});

	test('celebrates once at least one guest is coming', () => {
		expect(resolveResponseMood({ isAnswered: true, isAttending: true })).toBe('accepted');
	});

	test('turns sorry once nobody is coming', () => {
		expect(resolveResponseMood({ isAnswered: true, isAttending: false })).toBe('declined');
	});
});
