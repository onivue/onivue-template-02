import { render } from '@react-email/render';

import { AuthActionEmail } from '@/lib/email/templates/auth-action-email';
import { AUTH_EMAIL_CONTENT } from '@/lib/email/templates/content';
import { EventResponseEmail as EventResponseEmailTemplate } from '@/lib/email/templates/event-response-email';

export type AuthEmailKind = 'email-change' | 'email-verification' | 'magic-link' | 'password-reset';

export type AuthEmail = {
	kind: AuthEmailKind;
	to: string;
	url: string;
};

export type SummaryLine = {
	label: string;
	value: string;
};

export type ResponseGuest = {
	answers: SummaryLine[];
	name: string;
	status: 'accepted' | 'declined' | 'open';
};

// plain data on purpose: the email module renders what it is given and knows nothing about events
export type EventResponseEmail = {
	answers: SummaryLine[];
	eventTitle: string;
	eventUrl: string;
	guests: ResponseGuest[];
	invitationLabel: string;
	kind: 'event-response';
	to: string;
};

export type OutgoingEmail = AuthEmail | EventResponseEmail;

export type RenderedEmail = { html: string; subject: string; text: string };

export type EmailResult = { success: true } | { success: false; error: { message: string } };

// one method; the message kind is data, so the interface stops growing per template
export type EmailGateway = {
	send(message: OutgoingEmail): Promise<EmailResult>;
};

async function renderBoth(element: React.ReactElement, subject: string): Promise<RenderedEmail> {
	const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

	return { html, subject, text };
}

export async function renderEmail(message: OutgoingEmail): Promise<RenderedEmail> {
	if (message.kind === 'event-response') {
		return await renderBoth(
			<EventResponseEmailTemplate {...message} />,
			`${message.invitationLabel} hat geantwortet — ${message.eventTitle}`
		);
	}

	const content = AUTH_EMAIL_CONTENT[message.kind];

	return await renderBoth(<AuthActionEmail {...content} url={message.url} />, content.subject);
}
