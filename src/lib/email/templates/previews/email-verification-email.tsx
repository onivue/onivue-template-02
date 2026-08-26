import { AuthActionEmail } from '@/lib/email/templates/auth-action-email';
import { AUTH_EMAIL_CONTENT } from '@/lib/email/templates/content';

const PREVIEW_URL = 'https://onivue.app/api/auth/verify-email?token=preview-token';

export default function EmailVerificationEmailPreview() {
	return <AuthActionEmail {...AUTH_EMAIL_CONTENT['email-verification']} url={PREVIEW_URL} />;
}
