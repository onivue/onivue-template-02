const ROOT_PATH = '/';
const PATH_SEPARATOR = '/';
const EVENTS_PATH = '/events';

// public: no session needed · guest: only without a session · viewer: session required
export type RouteAccess = 'guest' | 'public' | 'viewer';

export type RouteName =
	| 'CONSENT'
	| 'EVENTS'
	| 'FORGOT_PASSWORD'
	| 'HOME'
	| 'INVITATION'
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
	// where a signed-in reader is sent instead of a guest-only route
	signedInPath?: string;
};

// one declaration per route: where it lives, who may see it, whether it appears in navigation
export const ROUTES = {
	// oauth consent screen; the provider redirects here with client_id/scope/code
	CONSENT: {
		access: 'viewer',
		path: '/consent',
	},
	// the working surface of the app; the landing page redirects here
	EVENTS: {
		access: 'viewer',
		nav: { label: 'Events', testId: 'navigation-events-link' },
		path: EVENTS_PATH,
	},
	FORGOT_PASSWORD: {
		access: 'guest',
		path: '/forgot-password',
	},
	// the landing page: it explains the app, so only a reader without a session has use for it
	HOME: {
		access: 'guest',
		path: ROOT_PATH,
		signedInPath: EVENTS_PATH,
	},
	// the guest link. public by design: possession of the token is the authorization (ADR-0004)
	INVITATION: {
		access: 'public',
		path: '/i',
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
	SETTINGS: ROUTES.SETTINGS.path,
	SETTINGS_PROFILE: `${ROUTES.SETTINGS.path}/profile`,
	SETTINGS_SECURITY: `${ROUTES.SETTINGS.path}/security`,
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

// next serves its metadata files as ordinary routes. they hold nothing session-specific, and a
// messenger asking for the preview image must not be answered with a redirect to the login page —
// so they are named here rather than left to the deny-by-default rule below.
const PUBLIC_METADATA_FILES = new Set(['apple-icon', 'icon', 'opengraph-image', 'twitter-image']);

export function isPublicMetadataFile(pathname: string): boolean {
	const segment = pathname.split(PATH_SEPARATOR).pop() ?? '';

	// generateImageMetadata numbers its output, e.g. /opengraph-image/2
	return PUBLIC_METADATA_FILES.has(segment.replace(/-\d+$/, ''));
}

function findRoute(pathname: string) {
	return Object.values(ROUTES).find((candidate) => matchesRoute(pathname, candidate.path));
}

// unknown paths are treated as viewer-only, keeping the proxy deny-by-default
export function getAccessFor(pathname: string): RouteAccess {
	if (isPublicMetadataFile(pathname)) {
		return 'public';
	}

	return findRoute(pathname)?.access ?? 'viewer';
}

// a guest-only route names where the reader who already has a session belongs instead
export function getSignedInRedirectFor(pathname: string): string {
	const route = findRoute(pathname);

	if (route && 'signedInPath' in route) {
		return route.signedInPath;
	}

	return APP_ROUTES.SETTINGS_PROFILE;
}

const NAVIGATION_ORDER = ['EVENTS', 'SETTINGS'] as const satisfies readonly RouteName[];

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

export const eventCalendarPath = (eventId: string): string => `${ROUTES.EVENTS.path}/${eventId}/calendar`;

export const invitationPath = (token: string): string => `${ROUTES.INVITATION.path}/${token}`;

export const invitationCalendarPath = (token: string): string => `${ROUTES.INVITATION.path}/${token}/calendar`;

export const settingsProfilePath = (): typeof APP_ROUTES.SETTINGS_PROFILE => APP_ROUTES.SETTINGS_PROFILE;

export const settingsSecurityPath = (): typeof APP_ROUTES.SETTINGS_SECURITY => APP_ROUTES.SETTINGS_SECURITY;
