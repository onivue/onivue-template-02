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

describe('a day without a time', () => {
	test('a beginning is read as the first moment of that day, a deadline as its last', () => {
		expect(toBerlinInputValue(parseBerlinDateTime('2026-07-15'))).toBe('2026-07-15');
		expect(toBerlinInputValue(parseBerlinDateTime('2026-07-15', 'end-of-day'), 'end-of-day')).toBe('2026-07-15');

		const deadline = parseBerlinDateTime('2026-07-15', 'end-of-day');
		const start = parseBerlinDateTime('2026-07-15');

		expect(deadline!.getTime()).toBeGreaterThan(start!.getTime());
		// a guest answering during the 15th is still inside a deadline named as that day
		expect(deadline!.getTime()).toBeGreaterThan(parseBerlinDateTime('2026-07-15T23:00')!.getTime());
	});

	test('a time that was given survives the round trip untouched', () => {
		expect(toBerlinInputValue(parseBerlinDateTime('2026-07-15T18:30'))).toBe('2026-07-15T18:30');
		expect(toBerlinInputValue(parseBerlinDateTime('2026-01-15T07:05'))).toBe('2026-01-15T07:05');
	});

	test('midnight reads back as no time, so clearing the time is not silently undone', () => {
		expect(toBerlinInputValue(parseBerlinDateTime('2026-07-15T00:00'))).toBe('2026-07-15');
	});

	test('the display drops the time only when none was given', () => {
		expect(formatBerlin(parseBerlinDateTime('2026-07-15'))).toBe('15. Juli 2026');
		expect(formatBerlin(parseBerlinDateTime('2026-07-15T18:30'))).toBe('15. Juli 2026, 18:30 Uhr');
		expect(formatBerlin(parseBerlinDateTime('2026-07-15', 'end-of-day'), 'end-of-day')).toBe('15. Juli 2026');
	});
});
