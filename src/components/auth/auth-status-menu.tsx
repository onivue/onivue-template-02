'use client';

import { ChevronsUpDown, LogIn, LogOut, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';

import type { Viewer } from '@/lib/auth/viewer';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APP_ROUTES } from '@/config/routes';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { cn } from '@/lib/utils';

// 'sidebar' sits on the dark navigation surface; 'inline' is a standalone control on the canvas
export type AuthStatusPlacement = 'inline' | 'sidebar';

type AuthStatusMenuProps = {
	placement: AuthStatusPlacement;
	user: Viewer | null;
};

const FALLBACK_INITIALS_LENGTH = 2;

// same height, inset and gap as a navigation item, so avatar and nav icons sit on one line
const SIDEBAR_TRIGGER_CLASS =
	'h-12 w-full min-w-0 justify-start gap-3 rounded-2xl px-3 text-left text-sidebar-primary-foreground/85 transition-colors hover:bg-sidebar-accent/15 hover:text-sidebar-primary-foreground focus-visible:ring-sidebar-ring/50 aria-expanded:bg-sidebar-accent/15 aria-expanded:text-sidebar-primary-foreground';
const INLINE_TRIGGER_CLASS =
	'h-12 max-w-[min(16rem,60vw)] gap-2.5 rounded-full border border-border bg-background p-2 shadow-sm shadow-foreground/10 transition-colors hover:bg-muted aria-expanded:bg-muted sm:pr-4';
const MENU_ITEM_CLASS = 'h-10 gap-2 rounded-xl px-2 font-medium';

function getAvatarFallback(user: Viewer): string {
	const source = user.name.trim() || user.email;
	const words = source.split(/[\s@._-]+/).filter(Boolean);
	const initials = words
		.map((word) => word[0])
		.join('')
		.slice(0, FALLBACK_INITIALS_LENGTH);

	return initials.toUpperCase() || 'U';
}

export function AuthStatusMenu({ placement, user }: AuthStatusMenuProps) {
	const { actions, isBusy, isRunning } = useAccountActions();
	const isSidebar = placement === 'sidebar';
	// without a name the row falls back to the address, which is long enough to warrant the smaller size
	const displayName = user?.name.trim() ?? '';
	const isAddressLabel = !displayName;

	if (!user) {
		return (
			<Button
				variant={isSidebar ? 'ghost' : 'outline'}
				size={isSidebar ? 'default' : 'lg'}
				className={cn(isSidebar ? SIDEBAR_TRIGGER_CLASS : 'rounded-full', 'shrink-0')}
				nativeButton={false}
				render={<Link href={APP_ROUTES.LOGIN} />}
				data-testid='global-login-button'
			>
				<LogIn data-icon='inline-start' aria-hidden='true' />
				Anmelden
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				type='button'
				className={isSidebar ? SIDEBAR_TRIGGER_CLASS : INLINE_TRIGGER_CLASS}
				aria-label='Account-Menü öffnen'
				data-testid='account-menu-trigger'
			>
				<Avatar className='shrink-0'>
					{user.image ? <AvatarImage src={user.image} alt={user.name || user.email} /> : null}
					<AvatarFallback
						className={cn(
							'text-xs font-bold',
							isSidebar
								? 'bg-sidebar-accent text-sidebar-accent-foreground'
								: 'bg-action-strong text-action-strong-foreground'
						)}
					>
						{getAvatarFallback(user)}
					</AvatarFallback>
				</Avatar>
				<span
					className={cn(
						'min-w-0 flex-1 truncate font-bold',
						isAddressLabel ? 'text-xs' : 'text-sm',
						isSidebar ? null : 'hidden sm:block'
					)}
				>
					{displayName || user.email}
				</span>
				{isSidebar ? <ChevronsUpDown className='size-4 shrink-0 opacity-60' aria-hidden='true' /> : null}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={isSidebar ? 'start' : 'end'}
				side={isSidebar ? 'top' : 'bottom'}
				sideOffset={8}
				// the sidebar popup takes the trigger's width, so it sits evenly inset in the navigation
				className={cn('rounded-2xl p-1.5', isSidebar ? null : 'w-64')}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className='grid grid-cols-[minmax(0,1fr)] gap-0.5 px-2 py-2'>
						<span className='truncate text-sm font-bold text-foreground'>{displayName || 'Account'}</span>
						<span className='truncate text-[0.7rem] font-medium text-muted-foreground'>{user.email}</span>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className={MENU_ITEM_CLASS}
						nativeButton={false}
						render={<Link href={APP_ROUTES.ACCOUNT} />}
						data-testid='account-menu-account-link'
					>
						<UserRound aria-hidden='true' />
						Account
					</DropdownMenuItem>
					<DropdownMenuItem
						className={MENU_ITEM_CLASS}
						nativeButton={false}
						render={<Link href={APP_ROUTES.SETTINGS} />}
						data-testid='account-menu-settings-link'
					>
						<Settings aria-hidden='true' />
						Settings
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className={MENU_ITEM_CLASS}
						variant='destructive'
						disabled={isBusy}
						onClick={() => void actions.signOut()}
						data-testid='account-menu-sign-out'
					>
						<LogOut aria-hidden='true' />
						{isRunning('sign-out') ? 'Melde ab...' : 'Abmelden'}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
