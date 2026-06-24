'use client';

import { Ellipsis, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isActiveNavigationPath, PRIMARY_NAVIGATION_ITEMS } from '@/components/layout/navigation.config';
import { Navigation } from '@/components/layout/navigation.desktop';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MobileNavigationProps = {
	isSidebarOpen: boolean;
	onCloseSidebar: () => void;
	onOpenSidebar: () => void;
};

const SIDEBAR_TRANSITION = {
	type: 'spring',
	stiffness: 360,
	damping: 34,
	mass: 0.85,
} as const;

const BACKDROP_TRANSITION = {
	duration: 0.18,
	ease: 'easeOut',
} as const;

export function MobileNavigation({ isSidebarOpen, onCloseSidebar, onOpenSidebar }: MobileNavigationProps) {
	const pathname = usePathname();

	return (
		<>
			<nav
				className='fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto grid max-w-sm grid-cols-4 gap-1 rounded-full border border-white/10 bg-[var(--ink)] p-1.5 shadow-[0_18px_48px_oklch(0.16_0.012_260_/_22%),0_0_0_1px_oklch(0.16_0.012_260_/_45%)] md:hidden'
				aria-label='Mobile Navigation'
				data-testid='mobile-bottom-navigation'
			>
				{PRIMARY_NAVIGATION_ITEMS.map((item) => {
					const Icon = item.icon;
					const isActive = isActiveNavigationPath(pathname, item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex min-h-12 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[0.62rem] font-bold leading-none outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
								isActive
									? 'text-[var(--lime-glow)]'
									: 'text-[oklch(0.69_0.01_260)] hover:text-sidebar-primary-foreground'
							)}
							aria-current={isActive ? 'page' : undefined}
							data-testid={`mobile-${item.testId}`}
						>
							<Icon className='size-4' aria-hidden='true' />
							<span>{item.label}</span>
						</Link>
					);
				})}

				<Button
					type='button'
					variant='ghost'
					className='min-h-12 flex-col gap-1 rounded-full px-2 py-2 text-[0.62rem] font-bold leading-none text-sidebar-primary-foreground/70 hover:text-sidebar-primary-foreground'
					aria-label='Mehr Navigation öffnen'
					aria-controls='mobile-sidebar-panel'
					aria-expanded={isSidebarOpen}
					onClick={onOpenSidebar}
					data-testid='mobile-more-button'
				>
					<Ellipsis aria-hidden='true' data-icon='inline-start' />
					<span>More</span>
				</Button>
			</nav>

			<AnimatePresence initial={false}>
				{isSidebarOpen ? (
					<motion.div
						className='fixed inset-0 z-50 md:hidden'
						data-testid='mobile-sidebar'
						initial={{ opacity: 1 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 1 }}
					>
						<motion.button
							type='button'
							className='absolute inset-0 bg-foreground/30 backdrop-blur-[2px]'
							aria-label='Navigation schließen'
							onClick={onCloseSidebar}
							data-testid='mobile-sidebar-backdrop'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={BACKDROP_TRANSITION}
						/>
						<motion.dialog
							id='mobile-sidebar-panel'
							open
							aria-modal='true'
							aria-label='Navigation'
							className='absolute inset-x-0 bottom-0 m-0 w-full border-0 bg-transparent p-0 text-inherit'
							initial={{ y: '115%', opacity: 0.98 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: '115%', opacity: 0.98 }}
							transition={SIDEBAR_TRANSITION}
							data-testid='mobile-sidebar-panel'
						>
							<Navigation
								className='min-h-0 rounded-b-none rounded-t-[2rem] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl shadow-foreground/20'
								onNavigate={onCloseSidebar}
								action={
									<Button
										type='button'
										variant='ghost'
										size='icon-sm'
										className='text-sidebar-accent hover:bg-sidebar-accent/12 hover:text-sidebar-accent'
										aria-label='Navigation schließen'
										onClick={onCloseSidebar}
										data-testid='mobile-sidebar-close'
									>
										<X aria-hidden='true' data-icon='inline-start' />
									</Button>
								}
							/>
						</motion.dialog>
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	);
}
