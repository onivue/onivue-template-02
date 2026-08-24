'use client';

import { Ellipsis, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { Navigation } from '@/components/layout/navigation.desktop';
import { useNavigationItems } from '@/components/layout/navigation.items';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MobileNavigationProps = {
	account: ReactNode;
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

// every slot in the bar shares one shape, so the "more" trigger cannot drift from the links
const MOBILE_ITEM_CLASS =
	'flex h-12 flex-col items-center justify-center gap-1 rounded-full px-1 text-xs leading-none font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-sidebar-ring/50';
const MOBILE_ITEM_MUTED_CLASS = 'text-sidebar-primary-foreground/75 hover:text-sidebar-primary-foreground';

export function MobileNavigation({ account, isSidebarOpen, onCloseSidebar, onOpenSidebar }: MobileNavigationProps) {
	const items = useNavigationItems();

	return (
		<>
			<nav
				className='fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto grid max-w-sm gap-1 rounded-full border border-sidebar-border bg-sidebar-primary p-1.5 text-sidebar-primary-foreground shadow-xl shadow-foreground/25 md:hidden'
				// one column per item plus the "more" trigger, so the count cannot drift from the registry
				style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}
				aria-label='Mobile Navigation'
				data-testid='mobile-bottom-navigation'
			>
				{items.map(({ href, icon: Icon, isActive, label, testId }) => (
					<Link
						key={href}
						href={href}
						className={cn(
							MOBILE_ITEM_CLASS,
							isActive ? 'bg-sidebar-accent/15 text-sidebar-accent' : MOBILE_ITEM_MUTED_CLASS
						)}
						aria-current={isActive ? 'page' : undefined}
						data-testid={`mobile-${testId}`}
					>
						<Icon className='size-5' aria-hidden='true' />
						<span className='max-w-full truncate'>{label}</span>
					</Link>
				))}

				<Button
					type='button'
					variant='ghost'
					className={cn(
						MOBILE_ITEM_CLASS,
						MOBILE_ITEM_MUTED_CLASS,
						'hover:bg-sidebar-accent/15 aria-expanded:bg-sidebar-accent/15 aria-expanded:text-sidebar-primary-foreground'
					)}
					aria-label='Mehr Navigation öffnen'
					aria-controls='mobile-sidebar-panel'
					aria-expanded={isSidebarOpen}
					onClick={onOpenSidebar}
					data-testid='mobile-more-button'
				>
					<Ellipsis className='size-5' aria-hidden='true' />
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
								account={account}
								className='min-h-0 rounded-b-none rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl shadow-foreground/20'
								onNavigate={onCloseSidebar}
								action={
									<Button
										type='button'
										variant='ghost'
										size='icon-lg'
										className='rounded-full text-sidebar-accent hover:bg-sidebar-accent/15 hover:text-sidebar-accent focus-visible:ring-sidebar-ring/50'
										aria-label='Navigation schließen'
										onClick={onCloseSidebar}
										data-testid='mobile-sidebar-close'
									>
										<X className='size-5' aria-hidden='true' />
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
