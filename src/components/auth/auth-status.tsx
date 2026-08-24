import { AuthStatusMenu, type AuthStatusPlacement } from '@/components/auth/auth-status-menu';
import { getViewer } from '@/lib/auth/viewer';

type AuthStatusProps = {
	placement: AuthStatusPlacement;
};

export async function AuthStatus({ placement }: AuthStatusProps) {
	const viewer = await getViewer();

	return <AuthStatusMenu placement={placement} user={viewer} />;
}
