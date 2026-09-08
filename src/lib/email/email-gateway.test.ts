import { describe, expect, test } from 'bun:test';

import { renderEmail } from '@/lib/email/email-gateway';
import { InMemoryEmailGateway } from '@/lib/email/in-memory-gateway';
import { ResendGateway } from '@/lib/email/resend-gateway';

const MAGIC_LINK_URL = 'https://onivue.app/api/auth/magic-link/verify?token=abc123';

describe('rendering by message kind', () => {
	test('a magic link renders its own subject and preview', async () => {
		const rendered = await renderEmail({ kind: 'magic-link', to: 'du@example.com', url: MAGIC_LINK_URL });

		expect(rendered.subject).toBe('Dein Login-Link für onivue');
		expect(rendered.text).toContain(MAGIC_LINK_URL);
		expect(rendered.html).toContain(MAGIC_LINK_URL.replaceAll('&', '&amp;'));
	});

	test('an email change renders a different subject', async () => {
		const rendered = await renderEmail({ kind: 'email-change', to: 'du@example.com', url: MAGIC_LINK_URL });

		expect(rendered.subject).toBe('E-Mail-Adresse für onivue ändern');
	});

	test('the url is escaped before it reaches the href', async () => {
		const rendered = await renderEmail({
			kind: 'magic-link',
			to: 'du@example.com',
			url: 'https://onivue.app/verify?a=1&b="><script>alert(1)</script>',
		});

		expect(rendered.html).not.toContain('<script>');
		expect(rendered.html).toContain('&amp;');
		expect(rendered.html).toContain('&quot;');
	});
});

describe('the in-memory adapter', () => {
	test('captures what would have been sent', async () => {
		const gateway = new InMemoryEmailGateway();

		const result = await gateway.send({ kind: 'magic-link', to: 'du@example.com', url: MAGIC_LINK_URL });

		expect(result).toEqual({ success: true });
		expect(gateway.inbox).toHaveLength(1);
		expect(gateway.lastMessage()).toEqual({
			kind: 'magic-link',
			to: 'du@example.com',
			url: MAGIC_LINK_URL,
		});
	});

	test('can be told to fail, without touching the network', async () => {
		const gateway = new InMemoryEmailGateway({ failWith: 'quota exceeded' });

		const result = await gateway.send({ kind: 'magic-link', to: 'du@example.com', url: MAGIC_LINK_URL });

		expect(result).toEqual({ success: false, error: { message: 'quota exceeded' } });
		expect(gateway.inbox).toHaveLength(0);
	});
});

function createTransport(behaviour: () => Promise<{ error?: { message: string } | null }>) {
	const payloads: { subject: string; to: string }[] = [];

	return {
		payloads,
		transport: {
			emails: {
				send: async (payload: { from: string; html: string; subject: string; text: string; to: string }) => {
					payloads.push({ subject: payload.subject, to: payload.to });

					return await behaviour();
				},
			},
		},
	};
}

describe('the resend adapter maps transport outcomes', () => {
	test('a clean send succeeds and carries the rendered subject', async () => {
		const { payloads, transport } = createTransport(async () => ({}));
		const gateway = new ResendGateway({ from: 'onivue@example.com', transport });

		const result = await gateway.send({ kind: 'magic-link', to: 'du@example.com', url: MAGIC_LINK_URL });

		expect(result).toEqual({ success: true });
		expect(payloads).toEqual([{ subject: 'Dein Login-Link für onivue', to: 'du@example.com' }]);
	});

	test('a returned transport error becomes a failed result', async () => {
		const { transport } = createTransport(async () => ({ error: { message: 'invalid recipient' } }));
		const gateway = new ResendGateway({ from: 'onivue@example.com', transport });

		const result = await gateway.send({ kind: 'magic-link', to: 'nope', url: MAGIC_LINK_URL });

		expect(result).toEqual({ success: false, error: { message: 'invalid recipient' } });
	});

	test('a thrown transport error becomes a failed result rather than propagating', async () => {
		const { transport } = createTransport(async () => {
			throw new Error('connection reset');
		});
		const gateway = new ResendGateway({ from: 'onivue@example.com', transport });

		const result = await gateway.send({ kind: 'magic-link', to: 'du@example.com', url: MAGIC_LINK_URL });

		expect(result).toEqual({ success: false, error: { message: 'connection reset' } });
	});
});

describe('the response notification', () => {
	const message = {
		answers: [{ label: 'Anreise', value: 'Mit dem Zug' }],
		eventTitle: 'Hochzeit von Anna und Ben',
		eventUrl: 'https://onivue.app/events/ev-1',
		guests: [
			{
				answers: [{ label: 'Menüwunsch', value: 'Vegetarisch' }],
				name: 'Robin Meier',
				status: 'accepted' as const,
			},
			{ answers: [], name: 'Hannah', status: 'declined' as const },
		],
		invitationLabel: 'Robin Meier & Hannah',
		kind: 'event-response' as const,
		to: 'host@example.com',
	};

	test('the subject names who answered and which event it was', async () => {
		const rendered = await renderEmail(message);

		expect(rendered.subject).toBe('Robin Meier & Hannah hat geantwortet — Hochzeit von Anna und Ben');
	});

	test('every name, verdict and written answer reaches the plain-text part too', async () => {
		const { text } = await renderEmail(message);

		expect(text).toContain('Robin Meier');
		expect(text).toContain('Zugesagt');
		expect(text).toContain('Hannah');
		expect(text).toContain('Abgesagt');
		expect(text).toContain('Menüwunsch');
		expect(text).toContain('Vegetarisch');
		expect(text).toContain('Anreise');
		expect(text).toContain('Mit dem Zug');
	});

	test('the host can get from the mail to the guest list', async () => {
		const { html } = await renderEmail(message);

		expect(html).toContain('https://onivue.app/events/ev-1');
	});
});
