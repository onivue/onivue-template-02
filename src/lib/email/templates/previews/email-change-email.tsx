import { AuthActionEmail } from '@/lib/email/templates/auth-action-email';
import { AUTH_EMAIL_CONTENT } from '@/lib/email/templates/content';

const PREVIEW_URL = 'https://onivue.app/api/auth/change-email/verify?token=preview-token';

export default function EmailChangeEmailPreview() {
	return <AuthActionEmail {...AUTH_EMAIL_CONTENT['email-change']} url={PREVIEW_URL} />;
}
