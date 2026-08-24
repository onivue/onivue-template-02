import { describe, expect, test } from 'bun:test';

import { deriveAuthUrls } from '@/config';

describe('auth url derivation', () => {
	test('the origin drops the path', () => {
		expect(deriveAuthUrls('https://onivue.app/some/path').origin).toBe('https://onivue.app');
	});

	test('a non-standard port stays part of the origin', () => {
		expect(deriveAuthUrls('http://localhost:3000').origin).toBe('http://localhost:3000');
	});

	test('the passkey rp id is the bare hostname, without port', () => {
		expect(deriveAuthUrls('http://localhost:3000').passkeyRpId).toBe('localhost');
		expect(deriveAuthUrls('https://onivue.app').passkeyRpId).toBe('onivue.app');
	});

	test('the loopback address is mapped to localhost, which webauthn requires', () => {
		expect(deriveAuthUrls('http://127.0.0.1:3000').passkeyRpId).toBe('localhost');
		expect(deriveAuthUrls('http://127.0.0.1:3000').origin).toBe('http://127.0.0.1:3000');
	});

	test('a subdomain is preserved as the rp id', () => {
		expect(deriveAuthUrls('https://app.onivue.app').passkeyRpId).toBe('app.onivue.app');
	});
});
