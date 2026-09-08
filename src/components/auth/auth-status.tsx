import { cacheLife } from 'next/cache';

import { AuthStatusMenu, type AuthStatusPlacement } from '@/components/auth/auth-status-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getViewer } from '@/lib/auth/viewer';
import { cn } from '@/lib/utils';

type AuthStatusProps = {
	placement: AuthStatusPlacement;
};

// cached in this browser only, never on the server — that is what lets the account row ride along
// with the prefetched shell instead of arriving after the navigation.
export async function AuthStatus({ placement }: AuthStatusProps) {
	'use cache: private';
	// five minutes of stale is the threshold for joining the shell
	cacheLife({ stale: 300, revalidate: 60, expire: 3600 });

	const viewer = await getViewer();

	return <AuthStatusMenu placement={placement} user={viewer} />;
}

export function AuthStatusSkeleton({ placement }: AuthStatusProps) {
	return (
		<div
			className={cn(
				'flex h-12 items-center gap-3 px-3',
				placement === 'sidebar' ? 'w-full rounded-2xl' : 'rounded-full border border-border'
			)}
			data-testid='auth-status-skeleton'
		>
			<Skeleton className='size-8 shrink-0 rounded-full' />
			<div className='grid min-w-0 flex-1 gap-1.5'>
				<Skeleton className='h-3 w-24' />
				<Skeleton className='h-2.5 w-32' />
			</div>
		</div>
	);
}
