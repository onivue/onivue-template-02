import { Home, Settings, UserRound, type LucideIcon } from 'lucide-react';

import { NAVIGATION_ROUTES, type RouteName } from '@/config/routes';

// icons stay out of the route registry so the proxy never pulls the icon library into its bundle
const NAVIGATION_ICONS = {
	ACCOUNT: UserRound,
	HOME: Home,
	SETTINGS: Settings,
} as const satisfies Partial<Record<RouteName, LucideIcon>>;

export type NavigationLinkItem = (typeof NAVIGATION_ROUTES)[number] & {
	icon: LucideIcon;
};

export const PRIMARY_NAVIGATION_ITEMS: readonly NavigationLinkItem[] = NAVIGATION_ROUTES.map((route) => ({
	...route,
	icon: NAVIGATION_ICONS[route.name],
}));
