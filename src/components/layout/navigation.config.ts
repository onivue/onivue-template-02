import { Home, Settings, UserRound, type LucideIcon } from 'lucide-react';

import { APP_ROUTES, type AppRoute } from '@/config/routes';

const PATH_SEPARATOR = '/';

export { APP_ROUTES };

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
