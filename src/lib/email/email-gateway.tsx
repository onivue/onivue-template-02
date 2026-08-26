import { render } from '@react-email/render';

import { AuthActionEmail } from '@/lib/email/templates/auth-action-email';
import { AUTH_EMAIL_CONTENT } from '@/lib/email/templates/content';

export type AuthEmailKind = 'email-change' | 'email-verification' | 'magic-link' | 'password-reset';

export type AuthEmail = {
	kind: AuthEmailKind;
	to: string;
	url: string;
};

export type EmailResult = { success: true } | { success: false; error: { message: string } };

// one method; the message kind is data, so the interface stops growing per template
export type EmailGateway = {
	send(message: AuthEmail): Promise<EmailResult>;
};

export async function renderAuthEmail(message: AuthEmail): Promise<{ html: string; subject: string; text: string }> {
	const content = AUTH_EMAIL_CONTENT[message.kind];
	const element = <AuthActionEmail {...content} url={message.url} />;

	const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

	return { html, subject: content.subject, text };
}
