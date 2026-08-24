'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

import { Footer } from '@/components/layout/footer';
import { useNavigationItems } from '@/components/layout/navigation.items';
import { cn } from '@/lib/utils';

type NavigationProps = {
	action?: ReactNode;
	className?: string;
	onNavigate?: () => void;
};

export function Navigation({ action, className, onNavigate }: NavigationProps) {
	const items = useNavigationItems();

	return (
		<aside
			className={cn(
				'relative flex flex-col rounded-[2rem] bg-sidebar-primary p-3 text-sidebar-primary-foreground shadow-lg shadow-foreground/10',
				className
			)}
			aria-label='Seitennavigation'
			data-testid='sidebar'
		>
			{action ? (
				<div className='mb-2 flex items-center justify-end px-1' data-testid='sidebar-action'>
					{action}
				</div>
			) : null}
			<nav className='grid gap-1.5'>
				{items.map(({ href, icon: Icon, isActive, label, testId }) => (
					<Link
						key={href}
						href={href}
						onClick={onNavigate}
						className={cn(
							'flex h-12 w-full items-center gap-3 rounded-[1.35rem] px-4 text-base font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-sidebar-ring/50',
							isActive
								? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-sidebar-accent/25'
								: 'text-sidebar-primary-foreground/60 hover:bg-sidebar-accent/12 hover:text-sidebar-primary-foreground'
						)}
						aria-current={isActive ? 'page' : undefined}
						data-testid={`sidebar-${testId}`}
					>
						<span
							className={cn(
								'flex size-8 items-center justify-center rounded-full transition-colors',
								isActive ? 'bg-sidebar-accent-foreground/10' : 'text-sidebar-accent/75'
							)}
						>
							<Icon className='size-5' aria-hidden='true' />
						</span>
						<span>{label}</span>
					</Link>
				))}
			</nav>
			<Footer placement='sidebar' />
		</aside>
	);
}
