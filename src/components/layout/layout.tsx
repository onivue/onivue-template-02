'use client';

import { Menu, Slash, X } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

type LayoutProps = {
	children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
	const { isSidebarOpen, openSidebar, closeSidebar } = useUiStore();

	return (
		<div className='min-h-dvh bg-background p-3 max-w-400 w-full mx-auto' data-testid='layout'>
			<header className='flex h-8 items-center justify-between gap-3 px-1 pb-2' data-testid='layout-header'>
				<div className='flex min-w-0 items-center gap-2'>
					<Button
						type='button'
						variant='ghost'
						size='icon-sm'
						className='md:hidden'
						aria-label='Navigation öffnen'
						aria-expanded={isSidebarOpen}
						onClick={openSidebar}
						data-testid='mobile-sidebar-open'
					>
						<Menu aria-hidden='true' />
					</Button>
					<div className='hidden size-5 items-center justify-center md:flex' aria-hidden='true'>
						<Slash className='size-4 stroke-3' />
					</div>
					<Link
						href='/'
						className='flex min-w-0 items-center gap-1.5 rounded-md px-1 text-xs font-medium outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50'
						data-testid='home-link'
					>
						<span className='truncate'>Home</span>
					</Link>
				</div>
			</header>

			<div className='grid min-h-[calc(100dvh-3.75rem)] gap-5 md:grid-cols-[256px_minmax(0,1fr)]'>
				<Sidebar className='hidden min-h-0 md:block' />
				<main
					className='min-h-[calc(100dvh-3.75rem)] overflow-hidden rounded-2xl bg-muted'
					data-testid='main-content'
				>
					{children}
				</main>
			</div>

			{isSidebarOpen ? (
				<div className='fixed inset-0 z-50 md:hidden' data-testid='mobile-sidebar'>
					<button
						type='button'
						className='absolute inset-0 bg-black/30'
						aria-label='Navigation schließen'
						onClick={closeSidebar}
						data-testid='mobile-sidebar-backdrop'
					/>
					<div className='absolute inset-y-3 left-3 flex w-48 flex-col gap-2'>
						<div className='flex h-8 items-center justify-between rounded-xl bg-background px-2 shadow-sm'>
							<Link
								href='/'
								className='flex items-center gap-2 rounded-md px-1 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
								onClick={closeSidebar}
								data-testid='mobile-home-link'
							>
								<Slash className='size-4 stroke-3' aria-hidden='true' />
								<span>Home</span>
							</Link>
							<Button
								type='button'
								variant='ghost'
								size='icon-sm'
								aria-label='Navigation schließen'
								onClick={closeSidebar}
								data-testid='mobile-sidebar-close'
							>
								<X aria-hidden='true' />
							</Button>
						</div>
						<Sidebar className={cn('min-h-0 flex-1')} onNavigate={closeSidebar} />
					</div>
				</div>
			) : null}
		</div>
	);
}
