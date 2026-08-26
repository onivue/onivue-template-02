'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import { useNavigationItems } from '@/components/layout/navigation.items';
import { cn } from '@/lib/utils';

type NavigationProps = {
	account?: ReactNode;
	action?: ReactNode;
	className?: string;
	onNavigate?: () => void;
};

export function Navigation({ account, action, className, onNavigate }: NavigationProps) {
	const items = useNavigationItems();

	return (
		<aside
			className={cn(
				'relative flex flex-col rounded-3xl bg-sidebar-primary p-3 text-sidebar-primary-foreground shadow-lg shadow-foreground/10',
				className
			)}
			aria-label='Seitennavigation'
			data-testid='sidebar'
		>
			{action ? (
				<div className='mb-2 flex shrink-0 items-center justify-end px-1' data-testid='sidebar-action'>
					{action}
				</div>
			) : null}
			{/* shrinks and scrolls on its own instead of pushing the account block out of the fixed-height sidebar */}
			<nav className='-mx-1 grid min-h-0 gap-1.5 overflow-y-auto overscroll-contain px-1'>
				{items.map(({ href, icon: Icon, isActive, label, testId }) => (
					<Link
						key={href}
						href={href}
						onClick={onNavigate}
						className={cn(
							'flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-base font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-sidebar-ring/50',
							isActive
								? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-sidebar-accent/25'
								: 'text-sidebar-primary-foreground/75 hover:bg-sidebar-accent/15 hover:text-sidebar-primary-foreground'
						)}
						aria-current={isActive ? 'page' : undefined}
						data-testid={`sidebar-${testId}`}
					>
						<span
							className={cn(
								'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
								isActive ? 'bg-sidebar-accent-foreground/10' : 'text-sidebar-accent'
							)}
						>
							<Icon className='size-5' aria-hidden='true' />
						</span>
						<span className='truncate'>{label}</span>
					</Link>
				))}
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
