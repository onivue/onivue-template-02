import { type ReactNode, Suspense } from 'react';

import { AuthStatus, AuthStatusSkeleton } from '@/components/auth/auth-status';
import { AppShell } from '@/components/layout/app-shell';

type LayoutProps = {
	children: ReactNode;
};

// the viewer is resolved here and handed to the client shell as a slot, in its own boundary so the
// navigation around it never waits on the session lookup
export function Layout({ children }: LayoutProps) {
	return (
		<AppShell
			account={
				<Suspense fallback={<AuthStatusSkeleton placement='sidebar' />}>
					<AuthStatus placement='sidebar' />
				</Suspense>
			}
		>
			{children}
		</AppShell>
	);
}
