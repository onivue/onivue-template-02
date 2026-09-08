import { Resend } from 'resend';

import { renderEmail, type EmailGateway, type EmailResult, type OutgoingEmail } from '@/lib/email/email-gateway';

type ResendTransport = {
	emails: {
		send(payload: {
			from: string;
			html: string;
			subject: string;
			text: string;
			to: string;
		}): Promise<{ error?: { message: string } | null }>;
	};
};

type ResendGatewayOptions = {
	from: string;
	transport: ResendTransport;
};

export class ResendGateway implements EmailGateway {
	private readonly from: string;
	private readonly transport: ResendTransport;

	// the transport is accepted, not constructed, so nothing here reaches for env
	public constructor({ from, transport }: ResendGatewayOptions) {
		this.from = from;
		this.transport = transport;
	}

	public async send(message: OutgoingEmail): Promise<EmailResult> {
		const { html, subject, text } = await renderEmail(message);

		try {
			const { error } = await this.transport.emails.send({
				from: this.from,
				html,
				subject,
				text,
				to: message.to,
			});

			if (error) {
				return { success: false, error: { message: error.message } };
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: {
					message: error instanceof Error ? error.message : 'mail could not be sent',
				},
			};
		}
	}
}

export function createResendTransport(apiKey: string): ResendTransport {
	return new Resend(apiKey);
}
