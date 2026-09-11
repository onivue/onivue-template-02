'use client';

import Link from 'next/link';
import { type ReactNode, Suspense } from 'react';

import type { ResolvedNavigationItem } from '@/components/layout/navigation.items';

import { UNRESOLVED_NAVIGATION_ITEMS, useNavigationItems } from '@/components/layout/navigation.items';
import { cn } from '@/lib/utils';

type MobileNavigationProps = {
	account: ReactNode;
};

// every link shares one shape; the account control completes the fixed grid
const MOBILE_ITEM_CLASS =
	'flex h-12 flex-col items-center justify-center gap-1 rounded-full px-1 text-xs leading-none font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-sidebar-ring/50';
const MOBILE_ITEM_MUTED_CLASS = 'text-sidebar-primary-foreground/75 hover:text-sidebar-primary-foreground';

function MobileNavigationLinks({ items }: { items: ResolvedNavigationItem[] }) {
	return (
		<>
			{items.map(({ href, icon: Icon, isActive, label, testId }) => (
				<Link
					aria-current={isActive ? 'page' : undefined}
					className={cn(
						MOBILE_ITEM_CLASS,
						isActive ? 'bg-sidebar-accent/15 text-sidebar-accent' : MOBILE_ITEM_MUTED_CLASS
					)}
					data-testid={`mobile-${testId}`}
					href={href}
					key={href}
				>
					<Icon aria-hidden='true' className='size-5' />
					<span className='max-w-full truncate'>{label}</span>
				</Link>
			))}
		</>
	);
}

function ActiveMobileNavigationLinks() {
	return <MobileNavigationLinks items={useNavigationItems()} />;
}

export function MobileNavigation({ account }: MobileNavigationProps) {
	// fixed by the registry, not by the path, so the bar never reflows when the highlight lands
	const columns = UNRESOLVED_NAVIGATION_ITEMS.length + 1;

	return (
		<nav
			className='fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto grid max-w-sm gap-1 rounded-full border border-sidebar-border bg-sidebar-primary p-1.5 text-sidebar-primary-foreground shadow-xl shadow-foreground/25 md:hidden'
			style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
			aria-label='Mobile Navigation'
			data-testid='mobile-bottom-navigation'
		>
			<Suspense fallback={<MobileNavigationLinks items={UNRESOLVED_NAVIGATION_ITEMS} />}>
				<ActiveMobileNavigationLinks />
			</Suspense>
			<div className='flex items-center justify-center' data-testid='mobile-account-menu'>
				{account}
			</div>
		</nav>
	);
}
