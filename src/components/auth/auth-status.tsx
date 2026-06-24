import { headers } from 'next/headers';

import { AuthStatusMenu, type AuthStatusUser } from '@/components/auth/auth-status-menu';
import { auth } from '@/lib/auth/auth';

export async function AuthStatus() {
	const session = await getSession();

	const user: AuthStatusUser | null = session
		? {
				email: session.user.email,
				image: session.user.image ?? null,
				name: session.user.name,
			}
		: null;

	return <AuthStatusMenu user={user} />;
}

async function getSession() {
	try {
		return await auth.api.getSession({
			headers: await headers(),
		});
	} catch {
		return null;
	}
}
