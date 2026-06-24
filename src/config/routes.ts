export const APP_ROUTES = {
	HOME: '/',
	LANDING: '/landing',
	ACCOUNT: '/account',
	SETTINGS: '/settings',
	LOGIN: '/login',
	REGISTER: '/register',
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
