'use client';

import { type ReactNode } from 'react';

import { Footer } from '@/components/layout/footer';
import { Navigation } from '@/components/layout/navigation.desktop';
import { MobileNavigation } from '@/components/layout/navigation.mobile';
import { useUiStore } from '@/stores/ui-store';

type AppShellProps = {
	account: ReactNode;
	children: ReactNode;
};

export function AppShell({ account, children }: AppShellProps) {
	const { isSidebarOpen, openSidebar, closeSidebar } = useUiStore();

	return (
		<div
			className='mx-auto flex w-full max-w-400 flex-col bg-background p-3 pb-[calc(env(safe-area-inset-bottom)+5rem)] text-foreground md:pb-3'
			data-testid='layout'
		>
			<div className='grid flex-1 grid-rows-[1fr] gap-4 md:grid-cols-[16rem_minmax(0,1fr)]'>
				{/* the sidebar is pinned to the viewport: 100dvh minus the shell's own p-3, so it never outgrows the screen */}
				<Navigation
					account={account}
					className='hidden min-h-0 md:sticky md:top-3 md:flex md:h-[calc(100dvh-1.5rem)]'
				/>
				{/* the content column owns the credit, so the sidebar runs down past both */}
				<div className='grid min-w-0 grid-rows-[1fr_auto]'>
					<main
						className='grid min-w-0 grid-rows-[1fr] rounded-3xl bg-background px-1 py-2 sm:px-2 md:px-4 md:py-4'
						data-testid='main-content'
					>
						{/* one centred column at every size: the page reads top to bottom on a wide screen
						    exactly as it has to on a phone, and nothing is ever two fields wide */}
						<div className='mx-auto w-full max-w-3xl'>{children}</div>
					</main>
					<Footer />
				</div>
			</div>

			<MobileNavigation
				account={account}
				isSidebarOpen={isSidebarOpen}
				onCloseSidebar={closeSidebar}
				onOpenSidebar={openSidebar}
			/>
		</div>
	);
}
