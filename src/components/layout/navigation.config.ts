import { Home, Settings, UserRound, type LucideIcon } from 'lucide-react';

const PATH_SEPARATOR = '/';

export const APP_ROUTES = {
	HOME: '/',
	LANDING: '/landing',
	ACCOUNT: '/account',
	SETTINGS: '/settings',
	LOGIN: '/login',
	REGISTER: '/register',
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

export type NavigationLinkItem = {
	href: AppRoute;
	icon: LucideIcon;
	label: string;
	testId: string;
};

export const PRIMARY_NAVIGATION_ITEMS = [
	{
		href: APP_ROUTES.HOME,
		icon: Home,
		label: 'Home',
		testId: 'navigation-home-link',
	},
	{
		href: APP_ROUTES.ACCOUNT,
		icon: UserRound,
		label: 'Account',
		testId: 'navigation-account-link',
	},
	{
		href: APP_ROUTES.SETTINGS,
		icon: Settings,
		label: 'Settings',
		testId: 'navigation-settings-link',
	},
] as const satisfies readonly NavigationLinkItem[];

export function isActiveNavigationPath(pathname: string, href: AppRoute): boolean {
	if (href === APP_ROUTES.HOME) {
		return pathname === href;
	}

	return pathname === href || pathname.startsWith(`${href}${PATH_SEPARATOR}`);
}
