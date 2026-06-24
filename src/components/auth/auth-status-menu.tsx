'use client';

import { LogIn, LogOut, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { authClient } from '@/lib/auth/auth-client';
import { authErrorHelper } from '@/lib/auth/auth-error-helper';

export type AuthStatusUser = {
	email: string;
	image: string | null;
	name: string;
};

type AuthStatusMenuProps = {
	user: AuthStatusUser | null;
};

const FALLBACK_INITIALS_LENGTH = 2;

function getAvatarFallback(user: AuthStatusUser): string {
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
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const isLoginPage = pathname === APP_ROUTES.LOGIN;

	async function handleSignOut(): Promise<void> {
		setIsSigningOut(true);

		try {
			await authClient.signOut();
			toast.success('Du bist abgemeldet.');
			router.push(APP_ROUTES.LANDING);
			router.refresh();
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Abmelden ist fehlgeschlagen.'
				)
			);
			setIsSigningOut(false);
		}
	}

	if (!user) {
		if (isLoginPage) {
			return null;
		}

		return (
			<div
				className='fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-50'
				data-testid='auth-status'
			>
				<Button
					render={<Link href={APP_ROUTES.LOGIN} />}
					variant='outline'
					size='lg'
					className='rounded-full bg-background/92 shadow-lg shadow-foreground/10 backdrop-blur'
					data-testid='global-login-button'
				>
					<LogIn data-icon='inline-start' aria-hidden='true' />
					Anmelden
				</Button>
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
					render={
						<Button
							type='button'
							variant='outline'
							size='lg'
							className='h-11 rounded-full bg-background/92 px-1.5 shadow-lg shadow-foreground/10 backdrop-blur sm:px-2 sm:pr-3'
							aria-label='Account-Menü öffnen'
							data-testid='account-menu-trigger'
						/>
					}
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
						<DropdownMenuItem
							render={<Link href={APP_ROUTES.ACCOUNT} />}
							data-testid='account-menu-account-link'
						>
							<UserRound data-icon='inline-start' aria-hidden='true' />
							Account
						</DropdownMenuItem>
						<DropdownMenuItem
							render={<Link href={APP_ROUTES.SETTINGS} />}
							data-testid='account-menu-settings-link'
						>
							<Settings data-icon='inline-start' aria-hidden='true' />
							Settings
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem
							variant='destructive'
							disabled={isSigningOut}
							onClick={() => void handleSignOut()}
							data-testid='account-menu-sign-out'
						>
							<LogOut data-icon='inline-start' aria-hidden='true' />
							{isSigningOut ? 'Melde ab...' : 'Abmelden'}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
