import { describe, expect, test } from 'bun:test';

import { DEFAULT_ACCENT, readableForeground, toThemeStyle } from '@/lib/events/event-theme';

describe('the invitation theme', () => {
	test('a light accent gets dark text, a dark accent gets light text', () => {
		expect(readableForeground('#bbfa0d')).toBe('#101010');
		expect(readableForeground('#ffffff')).toBe('#101010');
		expect(readableForeground('#1d3f91')).toBe('#ffffff');
		expect(readableForeground('#000000')).toBe('#ffffff');
	});

	test('a broken colour falls back rather than producing an unreadable page', () => {
		expect(readableForeground('rot')).toBe(readableForeground(DEFAULT_ACCENT));
	});

	test('the mode picks a curated surface set, never a free background', () => {
		const light = toThemeStyle({
			themeAccent: '#bbfa0d',
			themeFont: 'grotesk',
			themeHeaderImageKey: null,
			themeMode: 'light',
		});
		const dark = toThemeStyle({
			themeAccent: '#bbfa0d',
			themeFont: 'grotesk',
			themeHeaderImageKey: null,
			themeMode: 'dark',
		});

		expect(light['--invitation-background' as keyof typeof light]).toBe('#faf9f5');
		expect(dark['--invitation-background' as keyof typeof dark]).toBe('#14161a');
	});

	test('an unknown font falls back to the app font', () => {
		const style = toThemeStyle({
			themeAccent: '#bbfa0d',
			themeFont: 'comic',
			themeHeaderImageKey: null,
			themeMode: 'light',
		});

		expect(String(style['--invitation-font' as keyof typeof style])).toContain('space-grotesk');
	});
});
