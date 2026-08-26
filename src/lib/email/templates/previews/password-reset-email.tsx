import { AuthActionEmail } from '@/lib/email/templates/auth-action-email';
import { AUTH_EMAIL_CONTENT } from '@/lib/email/templates/content';

const PREVIEW_URL = 'https://onivue.app/api/auth/reset-password?token=preview-token';

export default function PasswordResetEmailPreview() {
	return <AuthActionEmail {...AUTH_EMAIL_CONTENT['password-reset']} url={PREVIEW_URL} />;
}
