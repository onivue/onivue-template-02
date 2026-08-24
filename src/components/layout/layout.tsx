import { type ReactNode } from 'react';

import { AuthStatus } from '@/components/auth/auth-status';
import { AppShell } from '@/components/layout/app-shell';

type LayoutProps = {
	children: ReactNode;
};

// the server boundary: the viewer is resolved here and handed to the client shell as a slot
export function Layout({ children }: LayoutProps) {
	return <AppShell account={<AuthStatus placement='sidebar' />}>{children}</AppShell>;
}
