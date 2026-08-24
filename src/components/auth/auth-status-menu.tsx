'use client';

import { LogIn, LogOut, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

type AuthStatusMenuProps = {
	user: Viewer | null;
};

const FALLBACK_INITIALS_LENGTH = 2;

function getAvatarFallback(user: Viewer): string {
	const source = user.name.trim() || user.email;
	const words = source.split(/[\s@._-]+/).filter(Boolean);
	const initials = words
		.map((word) => word[0])
		.join('')
		.slice(0, FALLBACK_INITIALS_LENGTH);

	return initials.toUpperCase() || 'U';
}

export function AuthStatusMenu({ user }: AuthStatusMenuProps) {
	const pathname = usePathname();
	const accountActions = useAccountActions();
	const isLoginPage = pathname === APP_ROUTES.LOGIN;

	if (!user) {
		if (isLoginPage) {
			return null;
		}

		return (
			<div
				className='fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-50'
				data-testid='auth-status'
			>
				<Link href={APP_ROUTES.LOGIN}>
					<Button
						variant='outline'
						size='lg'
						className='rounded-full bg-background/92 shadow-lg shadow-foreground/10 backdrop-blur'
						data-testid='global-login-button'
					>
						<LogIn data-icon='inline-start' aria-hidden='true' />
						Anmelden
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div
			className='fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-50'
			data-testid='auth-status'
		>
			<DropdownMenu>
				<DropdownMenuTrigger
					type='button'
					className='h-11 rounded-full bg-background/92 px-1.5 shadow-lg shadow-foreground/10 backdrop-blur border border-border hover:bg-muted sm:px-2 sm:pr-3 gap-1.5'
					aria-label='Account-Menü öffnen'
					data-testid='account-menu-trigger'
				>
					<Avatar>
						{user.image ? <AvatarImage src={user.image} alt={user.name || user.email} /> : null}
						<AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
					</Avatar>
					<span className='hidden max-w-36 truncate text-sm font-bold sm:inline'>
						{user.name || user.email}
					</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' sideOffset={8} className='min-w-60'>
					<DropdownMenuGroup>
						<DropdownMenuLabel>
							<span className='block truncate font-bold text-foreground'>{user.name || 'Account'}</span>
							<span className='block truncate text-xs font-medium text-muted-foreground'>
								{user.email}
							</span>
						</DropdownMenuLabel>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem data-testid='account-menu-account-link'>
							<Link href={APP_ROUTES.ACCOUNT} className='flex items-center gap-1.5'>
								<UserRound data-icon='inline-start' aria-hidden='true' />
								Account
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem data-testid='account-menu-settings-link'>
							<Link href={APP_ROUTES.SETTINGS} className='flex items-center gap-1.5'>
								<Settings data-icon='inline-start' aria-hidden='true' />
								Settings
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem
							variant='destructive'
							disabled={accountActions.isBusy}
							onClick={() => void accountActions.signOut()}
							data-testid='account-menu-sign-out'
						>
							<LogOut data-icon='inline-start' aria-hidden='true' />
							{accountActions.isRunning('sign-out') ? 'Melde ab...' : 'Abmelden'}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
