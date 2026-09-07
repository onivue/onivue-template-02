const ROOT_PATH = '/';
const PATH_SEPARATOR = '/';

// public: no session needed · guest: only without a session · viewer: session required
export type RouteAccess = 'guest' | 'public' | 'viewer';

export type RouteName =
	| 'ACCOUNT'
	| 'CONSENT'
	| 'EVENTS'
	| 'FORGOT_PASSWORD'
	| 'HOME'
	| 'INVITATION'
	| 'LANDING'
	| 'LOGIN'
	| 'REGISTER'
	| 'RESET_PASSWORD'
	| 'SETTINGS';

type RouteDefinition = {
	access: RouteAccess;
	nav?: {
		label: string;
		testId: string;
	};
	path: string;
};

// one declaration per route: where it lives, who may see it, whether it appears in navigation
export const ROUTES = {
	ACCOUNT: {
		access: 'viewer',
		nav: { label: 'Account', testId: 'navigation-account-link' },
		path: '/account',
	},
	// oauth consent screen; the provider redirects here with client_id/scope/code
	CONSENT: {
		access: 'viewer',
		path: '/consent',
	},
	// the working surface of the app; the root redirects here
	EVENTS: {
		access: 'viewer',
		nav: { label: 'Events', testId: 'navigation-events-link' },
		path: '/events',
	},
	FORGOT_PASSWORD: {
		access: 'guest',
		path: '/forgot-password',
	},
	HOME: {
		access: 'viewer',
		path: '/',
	},
	// the guest link. public by design: possession of the token is the authorization (ADR-0004)
	INVITATION: {
		access: 'public',
		path: '/i',
	},
	LANDING: {
		access: 'public',
		path: '/landing',
	},
	LOGIN: {
		access: 'guest',
		path: '/login',
	},
	REGISTER: {
		access: 'guest',
		path: '/register',
	},
	// no session required: a signed-in viewer may still hold a valid reset link in another tab
	RESET_PASSWORD: {
		access: 'public',
		path: '/reset-password',
	},
	SETTINGS: {
		access: 'viewer',
		nav: { label: 'Settings', testId: 'navigation-settings-link' },
		path: '/settings',
	},
} as const satisfies Record<RouteName, RouteDefinition>;

export const APP_ROUTES = {
	HOME: ROUTES.HOME.path,
	EVENTS: ROUTES.EVENTS.path,
	INVITATION: ROUTES.INVITATION.path,
	LANDING: ROUTES.LANDING.path,
	ACCOUNT: ROUTES.ACCOUNT.path,
	SETTINGS: ROUTES.SETTINGS.path,
	LOGIN: ROUTES.LOGIN.path,
	REGISTER: ROUTES.REGISTER.path,
	FORGOT_PASSWORD: ROUTES.FORGOT_PASSWORD.path,
	RESET_PASSWORD: ROUTES.RESET_PASSWORD.path,
	CONSENT: ROUTES.CONSENT.path,
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

// the single path predicate; '/' would prefix-match everything, so it matches exactly
export function matchesRoute(pathname: string, path: string): boolean {
	if (path === ROOT_PATH) {
		return pathname === ROOT_PATH;
	}

	return pathname === path || pathname.startsWith(`${path}${PATH_SEPARATOR}`);
}

// unknown paths are treated as viewer-only, keeping the proxy deny-by-default
export function getAccessFor(pathname: string): RouteAccess {
	const route = Object.values(ROUTES).find((candidate) => matchesRoute(pathname, candidate.path));

	return route?.access ?? 'viewer';
}

const NAVIGATION_ORDER = ['EVENTS', 'ACCOUNT', 'SETTINGS'] as const satisfies readonly RouteName[];

export const NAVIGATION_ROUTES = NAVIGATION_ORDER.map((name) => ({
	href: ROUTES[name].path,
	label: ROUTES[name].nav.label,
	name,
	testId: ROUTES[name].nav.testId,
}));

export type NavigationRoute = (typeof NAVIGATION_ROUTES)[number];

// dynamic paths belong here too: nothing internal should be assembled from string literals.
// two sections only: the overview carries the guest list, the settings page carries the form.
export const eventPath = (eventId: string, section?: 'settings'): string =>
	section ? `${ROUTES.EVENTS.path}/${eventId}/${section}` : `${ROUTES.EVENTS.path}/${eventId}`;

export const eventExportPath = (eventId: string): string => `${ROUTES.EVENTS.path}/${eventId}/export`;

export const invitationPath = (token: string): string => `${ROUTES.INVITATION.path}/${token}`;
