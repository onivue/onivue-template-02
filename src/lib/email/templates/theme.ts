// kept out of src/config.ts on purpose: that module validates the full server
// env on import, which would make every email template unrenderable outside
// a fully configured server (including the react-email preview tooling)
export const EMAIL_APP_NAME = 'onivue';

// fixed hex mirrors of the oklch tokens in src/app/globals.css — email clients
// don't resolve css variables or oklch, so the brand palette is restated here
export const EMAIL_COLORS = {
	background: '#faf9f5',
	surface: '#ffffff',
	border: '#e6e5e0',
	ink: '#14151a',
	'ink-soft': '#687078',
	lime: '#d6ff42',
	'lime-soft': '#f4fbd9',
	'accent-strong': '#3f6b2e',
} as const;
