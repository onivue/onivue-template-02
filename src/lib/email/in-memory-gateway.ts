import type { AuthEmail, EmailGateway, EmailResult } from '@/lib/email/email-gateway';

type InMemoryGatewayOptions = {
	failWith?: string;
};

// the second adapter: makes the seam real, and gives tests an inbox to assert against
export class InMemoryEmailGateway implements EmailGateway {
	public readonly inbox: AuthEmail[] = [];

	private readonly failWith?: string;

	public constructor({ failWith }: InMemoryGatewayOptions = {}) {
		this.failWith = failWith;
	}

	public async send(message: AuthEmail): Promise<EmailResult> {
		if (this.failWith) {
			return { success: false, error: { message: this.failWith } };
		}

		this.inbox.push(message);

		return { success: true };
	}

	public lastMessage(): AuthEmail | undefined {
		return this.inbox.at(-1);
	}
}
