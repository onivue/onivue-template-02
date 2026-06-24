import { Resend } from 'resend';

import { APP_CONFIG } from '@/config';

type SendAuthEmailParams = {
	previewText: string;
	subject: string;
	to: string;
	url: string;
};

type EmailServiceError = {
	message: string;
};

type EmailServiceResult = { success: true } | { success: false; error: EmailServiceError };

const EMAIL_LINK_STYLE =
	'display:inline-block;border-radius:999px;background:#14151a;color:#d6ff42;font-weight:700;padding:14px 18px;text-decoration:none;';

export class EmailService {
	private readonly resend: Resend;

	public constructor() {
		this.resend = new Resend(APP_CONFIG.mail.resendApiKey);
	}

	public async sendMagicLink(email: string, url: string): Promise<EmailServiceResult> {
		return await this.sendAuthEmail({
			previewText: 'Dein Login-Link ist 15 Minuten gültig.',
			subject: 'Dein Login-Link für onivue',
			to: email,
			url,
		});
	}

	public async sendChangeEmailConfirmation(email: string, url: string): Promise<EmailServiceResult> {
		return await this.sendAuthEmail({
			previewText: 'Bestätige die Änderung deiner E-Mail-Adresse.',
			subject: 'E-Mail-Adresse für onivue ändern',
			to: email,
			url,
		});
	}

	private async sendAuthEmail(params: SendAuthEmailParams): Promise<EmailServiceResult> {
		try {
			const { error } = await this.resend.emails.send({
				from: APP_CONFIG.mail.from,
				html: this.renderAuthEmail(params),
				subject: params.subject,
				text: `${params.previewText}\n\n${params.url}`,
				to: params.to,
			});

			if (error) {
				return {
					success: false,
					error: {
						message: error.message,
					},
				};
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

	private renderAuthEmail(params: SendAuthEmailParams): string {
		return `
			<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14151a;">
				<p>${params.previewText}</p>
				<p><a href="${params.url}" target="_blank" rel="noopener noreferrer" style="${EMAIL_LINK_STYLE}">Weiter zu onivue</a></p>
				<p style="color:#687078;font-size:13px;">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
			</div>
		`;
	}
}
