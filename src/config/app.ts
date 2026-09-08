// client-safe app constants: nothing here may read process.env, so any component can import it

export const APP_CONFIG = {
	app: {
		name: 'event.onivue',
	},
	auth: {
		magicLinkExpiresInSeconds: 900,
		passkeyRpName: 'event.onivue',
		resetPasswordExpiresInSeconds: 1800,
		// how long a session may be read from the cookie instead of the database, and therefore how
		// long a session revoked elsewhere still resolves
		sessionCookieCacheSeconds: 300,
	},
} as const;
