import { describe, expect, test } from 'bun:test';

import { buildTimeOptions, normalizeTimeInput } from '@/lib/time-input';

describe('normalizeTimeInput', () => {
	test('a bare hour fills its minutes in', () => {
		expect(normalizeTimeInput('9')).toBe('09:00');
		expect(normalizeTimeInput('18')).toBe('18:00');
	});

	test('the last two digits are always the minutes', () => {
		expect(normalizeTimeInput('930')).toBe('09:30');
		expect(normalizeTimeInput('1830')).toBe('18:30');
	});

	test('whatever separator was typed is ignored', () => {
		expect(normalizeTimeInput('18:30')).toBe('18:30');
		expect(normalizeTimeInput('18.30')).toBe('18:30');
		expect(normalizeTimeInput(' 18 30 ')).toBe('18:30');
	});

	test('nothing typed and nothing that can be a time both come back empty', () => {
		expect(normalizeTimeInput('')).toBe('');
		expect(normalizeTimeInput('   ')).toBe('');
		expect(normalizeTimeInput('abc')).toBe('');
		expect(normalizeTimeInput('25')).toBe('');
		expect(normalizeTimeInput('1899')).toBe('');
	});

	test('midnight is a time like any other, not an absence', () => {
		expect(normalizeTimeInput('0')).toBe('00:00');
		expect(normalizeTimeInput('0000')).toBe('00:00');
	});
});

describe('buildTimeOptions', () => {
	test('covers the day from midnight to the last step', () => {
		const options = buildTimeOptions(30);

		expect(options).toHaveLength(48);
		expect(options[0]).toBe('00:00');
		expect(options.at(-1)).toBe('23:30');
		expect(options).toContain('12:00');
	});
});
