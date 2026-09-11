'use client';

import { type ReactNode } from 'react';

import { Footer } from '@/components/layout/footer';
import { MobileNavigation } from '@/components/layout/navigation.mobile';
import { TopNavigation } from '@/components/layout/navigation.top';

type AppShellProps = {
	account: ReactNode;
	children: ReactNode;
};

export function AppShell({ account, children }: AppShellProps) {
	return (
		<div
			className='mx-auto flex w-full max-w-400 flex-col bg-background p-3 pb-[calc(env(safe-area-inset-bottom)+5rem)] text-foreground md:gap-4 md:pb-3'
			data-testid='layout'
		>
			<TopNavigation account={account} />
			<div className='grid min-w-0 flex-1 grid-rows-[1fr_auto]'>
				<main
					className='grid min-w-0 grid-rows-[1fr] rounded-3xl bg-background px-1 py-2 sm:px-2 md:px-4 md:py-4'
					data-testid='main-content'
				>
					<div className='mx-auto w-full max-w-3xl'>{children}</div>
				</main>
				<Footer />
			</div>

			<MobileNavigation account={account} />
		</div>
	);
}
