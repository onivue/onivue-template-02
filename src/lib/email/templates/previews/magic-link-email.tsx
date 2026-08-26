import { AuthActionEmail } from '@/lib/email/templates/auth-action-email';
import { AUTH_EMAIL_CONTENT } from '@/lib/email/templates/content';

const PREVIEW_URL = 'https://onivue.app/api/auth/magic-link/verify?token=preview-token';

export default function MagicLinkEmailPreview() {
	return <AuthActionEmail {...AUTH_EMAIL_CONTENT['magic-link']} url={PREVIEW_URL} />;
}
