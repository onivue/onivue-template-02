// what a link preview shows when this app is shared. it is not the app config: those values are
// client-safe constants, these are the ones a messenger reads out of the document head.

export const SITE = {
	description:
		'Events anlegen, Gäste eintragen und Einladungslinks verschicken — die Zu- und Absagen laufen an einem Ort zusammen.',
	locale: 'de_DE',
	tagline: 'Einladungen, die ankommen',
} as const;

// satori, which renders the og image, reads neither css variables nor oklch. these mirror the
// tokens in globals.css: --background, --ink, --lime-glow, --ink-soft.
export const OG_COLORS = {
	accent: '#bbfa0d',
	background: '#f9f9f6',
	ink: '#04060a',
	inkSoft: '#545860',
} as const;

export const OG_SIZE = { height: 630, width: 1200 } as const;
