// client-safe app constants: nothing here may read process.env, so any component can import it

export const APP_CONFIG = {
	app: {
		name: 'event.onivue',
	},
	auth: {
		magicLinkExpiresInSeconds: 900,
		passkeyRpName: 'onivue',
		resetPasswordExpiresInSeconds: 1800,
	},
} as const;
