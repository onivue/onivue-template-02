'use client';

import { usePathname } from 'next/navigation';

import { PRIMARY_NAVIGATION_ITEMS, type NavigationLinkItem } from '@/components/layout/navigation.config';
import { matchesRoute } from '@/config/routes';

export type ResolvedNavigationItem = NavigationLinkItem & {
	isActive: boolean;
};

// the active-state rule, resolved once for every navigation surface
export function resolveNavigationItems(pathname: string): ResolvedNavigationItem[] {
	return PRIMARY_NAVIGATION_ITEMS.map((item) => ({
		...item,
		isActive: matchesRoute(pathname, item.href),
	}));
}

export function useNavigationItems(): ResolvedNavigationItem[] {
	return resolveNavigationItems(usePathname());
}

// the path is only known at request time, so this is what the prerendered shell ships: every link
// there and clickable, the highlight a moment later.
export const UNRESOLVED_NAVIGATION_ITEMS: ResolvedNavigationItem[] = PRIMARY_NAVIGATION_ITEMS.map((item) => ({
	...item,
	isActive: false,
}));
