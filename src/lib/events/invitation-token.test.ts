import { describe, expect, test } from 'bun:test';

import { createInvitationToken } from '@/lib/events/invitation-token';

describe('invitation tokens', () => {
	test('a token is url-safe and carries 128 bits', () => {
		const token = createInvitationToken();

		expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
	});

	test('every byte of the source reaches the token', () => {
		const token = createInvitationToken(() => new Uint8Array(16).fill(255));

		expect(token).toBe('_'.repeat(21) + 'w');
	});

	test('tokens do not repeat', () => {
		const tokens = new Set(Array.from({ length: 500 }, () => createInvitationToken()));

		expect(tokens.size).toBe(500);
	});
});
