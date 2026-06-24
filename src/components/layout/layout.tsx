'use client';

import { type ReactNode } from 'react';

import { MobileNavigation } from '@/components/layout/naviagtion.mobile';
import { Navigation } from '@/components/layout/navigation.desktop';
import { useUiStore } from '@/stores/ui-store';

type LayoutProps = {
	children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
	const { isSidebarOpen, openSidebar, closeSidebar } = useUiStore();

	return (
		<div
			className='mx-auto min-h-dvh w-full max-w-400 bg-background p-3 pb-24 text-foreground md:pb-3'
			data-has-sidebar='true'
			data-testid='layout'
		>
			<div className='grid min-h-[calc(100dvh-1.5rem)] gap-5 md:grid-cols-[256px_minmax(0,1fr)]'>
				<Navigation className='hidden min-h-0 md:flex' />
				<main
					className='min-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-3xl bg-background'
					data-testid='main-content'
				>
					{children}
				</main>
			</div>

			<MobileNavigation isSidebarOpen={isSidebarOpen} onCloseSidebar={closeSidebar} onOpenSidebar={openSidebar} />
		</div>
	);
}
