'use client';

import Link from 'next/link';
import { type ReactNode, Suspense } from 'react';

import type { ResolvedNavigationItem } from '@/components/layout/navigation.items';

import { UNRESOLVED_NAVIGATION_ITEMS, useNavigationItems } from '@/components/layout/navigation.items';
import { cn } from '@/lib/utils';

type NavigationProps = {
	account?: ReactNode;
	action?: ReactNode;
	className?: string;
	onNavigate?: () => void;
};

type NavigationLinksProps = {
	items: ResolvedNavigationItem[];
	onNavigate?: () => void;
};

// takes resolved items rather than reading the path, so shell and highlighted version share markup
function NavigationLinks({ items, onNavigate }: NavigationLinksProps) {
	return (
		<>
			{items.map(({ href, icon: Icon, isActive, label, testId }) => (
				<Link
					aria-current={isActive ? 'page' : undefined}
					className={cn(
						'flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-base font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-sidebar-ring/50',
						isActive
							? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-sidebar-accent/25'
							: 'text-sidebar-primary-foreground/75 hover:bg-sidebar-accent/15 hover:text-sidebar-primary-foreground'
					)}
					data-testid={`sidebar-${testId}`}
					href={href}
					key={href}
					onClick={onNavigate}
				>
					<span
						className={cn(
							'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
							isActive ? 'bg-sidebar-accent-foreground/10' : 'text-sidebar-accent'
						)}
					>
						<Icon aria-hidden='true' className='size-5' />
					</span>
					<span className='truncate'>{label}</span>
				</Link>
			))}
		</>
	);
}

function ActiveNavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
	return <NavigationLinks items={useNavigationItems()} onNavigate={onNavigate} />;
}

export function Navigation({ account, action, className, onNavigate }: NavigationProps) {
	return (
		<aside
			aria-label='Seitennavigation'
			className={cn(
				'relative flex flex-col rounded-3xl bg-sidebar-primary p-3 text-sidebar-primary-foreground shadow-lg shadow-foreground/10',
				className
			)}
			data-testid='sidebar'
		>
			{action ? (
				<div className='mb-2 flex shrink-0 items-center justify-end px-1' data-testid='sidebar-action'>
					{action}
				</div>
			) : null}
			{/* shrinks and scrolls on its own instead of pushing the account block out of the fixed-height sidebar */}
			<nav className='-mx-1 grid min-h-0 gap-1.5 overflow-y-auto overscroll-contain px-1'>
				<Suspense fallback={<NavigationLinks items={UNRESOLVED_NAVIGATION_ITEMS} onNavigate={onNavigate} />}>
					<ActiveNavigationLinks onNavigate={onNavigate} />
				</Suspense>
			</nav>
			{account ? (
				<div
					className='mt-auto grid min-w-0 shrink-0 grid-cols-[minmax(0,1fr)] gap-1.5 border-t border-sidebar-border pt-3'
					data-testid='sidebar-account'
				>
					{account}
				</div>
			) : null}
		</aside>
	);
}
