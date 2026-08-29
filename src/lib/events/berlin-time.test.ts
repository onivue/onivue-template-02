import { describe, expect, test } from 'bun:test';

import { formatBerlin, parseBerlinDateTime, toBerlinInputValue } from '@/lib/events/berlin-time';

describe('berlin wall-clock time', () => {
	test('a winter time is read as CET (utc+1)', () => {
		expect(parseBerlinDateTime('2026-01-15T18:00')?.toISOString()).toBe('2026-01-15T17:00:00.000Z');
	});

	test('a summer time is read as CEST (utc+2)', () => {
		expect(parseBerlinDateTime('2026-07-15T18:00')?.toISOString()).toBe('2026-07-15T16:00:00.000Z');
	});

	test('the round trip through an input keeps the wall-clock time', () => {
		expect(toBerlinInputValue(parseBerlinDateTime('2026-07-15T18:00'))).toBe('2026-07-15T18:00');
		expect(toBerlinInputValue(parseBerlinDateTime('2026-01-15T07:05'))).toBe('2026-01-15T07:05');
	});

	test('an empty or broken value is simply no date', () => {
		expect(parseBerlinDateTime('')).toBeNull();
		expect(parseBerlinDateTime(null)).toBeNull();
		expect(parseBerlinDateTime('irgendwann')).toBeNull();
	});

	test('display is german and in berlin time', () => {
		expect(formatBerlin(new Date('2026-07-15T16:00:00Z'))).toBe('15. Juli 2026, 18:00 Uhr');
		expect(formatBerlin(null)).toBe('');
	});
});
