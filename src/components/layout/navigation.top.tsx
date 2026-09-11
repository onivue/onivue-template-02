'use client';

import Link from 'next/link';
import { type ReactNode, Suspense } from 'react';

import type { ResolvedNavigationItem } from '@/components/layout/navigation.items';

import { UNRESOLVED_NAVIGATION_ITEMS, useNavigationItems } from '@/components/layout/navigation.items';
import { cn } from '@/lib/utils';

type TopNavigationProps = {
	account: ReactNode;
};

const TOP_NAVIGATION_ITEM_CLASS =
	'flex h-12 min-w-28 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-sidebar-ring/50';

function TopNavigationLinks({ items }: { items: ResolvedNavigationItem[] }) {
	return (
		<>
			{items.map(({ href, icon: Icon, isActive, label, testId }) => (
				<Link
					aria-current={isActive ? 'page' : undefined}
					className={cn(
						TOP_NAVIGATION_ITEM_CLASS,
						isActive
							? 'bg-sidebar-accent text-sidebar-accent-foreground'
							: 'text-sidebar-primary-foreground/75 hover:bg-sidebar-accent/15 hover:text-sidebar-primary-foreground'
					)}
					data-testid={`desktop-${testId}`}
					href={href}
					key={href}
				>
					<Icon aria-hidden='true' className='size-5' />
					<span>{label}</span>
				</Link>
			))}
		</>
	);
}

function ActiveTopNavigationLinks() {
	return <TopNavigationLinks items={useNavigationItems()} />;
}

export function TopNavigation({ account }: TopNavigationProps) {
	return (
		<header
			className='sticky top-3 z-40 mx-auto hidden w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-full border border-sidebar-border bg-sidebar-primary p-1.5 text-sidebar-primary-foreground shadow-xl shadow-foreground/20 md:grid'
			data-testid='desktop-top-navigation'
		>
			<nav aria-label='Hauptnavigation' className='flex min-w-0 gap-1'>
				<Suspense fallback={<TopNavigationLinks items={UNRESOLVED_NAVIGATION_ITEMS} />}>
					<ActiveTopNavigationLinks />
				</Suspense>
			</nav>
			<div className='min-w-0' data-testid='desktop-account-menu'>
				{account}
			</div>
		</header>
	);
}
