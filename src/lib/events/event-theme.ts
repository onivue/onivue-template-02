import type { CSSProperties } from 'react';

// what a host may change about the guest page, and what the app keeps hold of. the accent is free;
// the surfaces are two curated presets, because a free background produces unreadable pages.

export type ThemeMode = 'dark' | 'light';
export type ThemeFont = 'grotesk' | 'script' | 'serif';

export type EventTheme = {
	themeAccent: string;
	themeFont: string;
	themeHeaderImageKey: null | string;
	themeMode: ThemeMode;
};

export const THEME_FONTS = {
	grotesk: { label: 'Space Grotesk', stack: 'var(--font-space-grotesk), system-ui, sans-serif' },
	script: { label: 'Caveat', stack: 'var(--font-invitation-script), cursive' },
	serif: { label: 'Playfair Display', stack: 'var(--font-invitation-serif), Georgia, serif' },
} as const satisfies Record<ThemeFont, { label: string; stack: string }>;

const SURFACES = {
	dark: { background: '#14161a', border: '#2b2f36', panel: '#1c1f25', soft: '#a2a9b4', text: '#f4f5f7' },
	light: { background: '#faf9f5', border: '#e4e1d8', panel: '#ffffff', soft: '#5f6058', text: '#16170f' },
} as const;

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
export const DEFAULT_ACCENT = '#bbfa0d';

function channel(value: number): number {
	const ratio = value / 255;

	return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

// wcag relative luminance. the accent is picked by a person with a colour picker, so the text on
// top of it has to be chosen for them — a lime button with white text is unreadable.
export function relativeLuminance(hex: string): number {
	const value = HEX_PATTERN.test(hex) ? hex : DEFAULT_ACCENT;
	const red = Number.parseInt(value.slice(1, 3), 16);
	const green = Number.parseInt(value.slice(3, 5), 16);
	const blue = Number.parseInt(value.slice(5, 7), 16);

	return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

export function readableForeground(hex: string): string {
	return relativeLuminance(hex) > 0.45 ? '#101010' : '#ffffff';
}

export function isThemeFont(value: string): value is ThemeFont {
	return value in THEME_FONTS;
}

// the theme reaches the page as custom properties on one element, so nothing below it needs to
// know a theme exists
export function toThemeStyle(theme: EventTheme): CSSProperties {
	const accent = HEX_PATTERN.test(theme.themeAccent) ? theme.themeAccent : DEFAULT_ACCENT;
	const surface = SURFACES[theme.themeMode];
	const font = isThemeFont(theme.themeFont) ? theme.themeFont : 'grotesk';

	return {
		'--invitation-accent': accent,
		'--invitation-accent-foreground': readableForeground(accent),
		'--invitation-background': surface.background,
		'--invitation-border': surface.border,
		'--invitation-font': THEME_FONTS[font].stack,
		'--invitation-panel': surface.panel,
		'--invitation-soft': surface.soft,
		'--invitation-text': surface.text,
	} as CSSProperties;
}
