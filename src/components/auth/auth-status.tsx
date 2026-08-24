import { AuthStatusMenu } from '@/components/auth/auth-status-menu';
import { getViewer } from '@/lib/auth/viewer';

export async function AuthStatus() {
	const viewer = await getViewer();

	return <AuthStatusMenu user={viewer} />;
}
