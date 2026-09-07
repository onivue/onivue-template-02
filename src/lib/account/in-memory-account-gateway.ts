import type { AccountRecordGateway } from '@/lib/account/account-overview';
import type { ConsentRecord } from '@/lib/mcp/mcp-connection';

type InMemoryAccountGatewayOptions = {
	consents?: Record<string, ConsentRecord[]>;
	// resolves only once both reads have started, so a serial caller deadlocks the test instead of
	// passing it
	gateOnBothReads?: boolean;
	withPassword?: string[];
};

// the second adapter: makes the seam real, and lets tests drive the shaping rules without a database
export class InMemoryAccountGateway implements AccountRecordGateway {
	public readonly startedReads: string[] = [];

	private readonly consents: Record<string, ConsentRecord[]>;
	private readonly withPassword: Set<string>;
	private readonly bothReadsStarted: Promise<void> | null;
	private releaseGate: (() => void) | null = null;

	public constructor({
		consents = {},
		gateOnBothReads = false,
		withPassword = [],
	}: InMemoryAccountGatewayOptions = {}) {
		this.consents = consents;
		this.withPassword = new Set(withPassword);
		this.bothReadsStarted = gateOnBothReads
			? new Promise((resolve) => {
					this.releaseGate = resolve;
				})
			: null;
	}

	public async hasCredentialPassword(userId: string): Promise<boolean> {
		await this.recordStart('hasCredentialPassword');

		return this.withPassword.has(userId);
	}

	public async listConsents(userId: string): Promise<ConsentRecord[]> {
		await this.recordStart('listConsents');

		return this.consents[userId] ?? [];
	}

	private async recordStart(name: string): Promise<void> {
		this.startedReads.push(name);

		if (!this.bothReadsStarted) {
			return;
		}

		if (this.startedReads.length >= 2) {
			this.releaseGate?.();
		}

		await this.bothReadsStarted;
	}
}
