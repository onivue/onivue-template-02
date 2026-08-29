import { describe, expect, test } from 'bun:test';

import { checkImage, headerImageKey, isStoredKey, MAX_IMAGE_BYTES } from '@/lib/storage/object-storage';

describe('what may enter the bucket', () => {
	test('the supported image types are accepted and named', () => {
		expect(checkImage('image/jpeg', 1000)).toEqual({ extension: 'jpg', ok: true });
		expect(checkImage('image/PNG', 1000)).toEqual({ extension: 'png', ok: true });
		expect(checkImage('image/webp', 1000)).toEqual({ extension: 'webp', ok: true });
	});

	test('anything that is not an image is refused', () => {
		expect(checkImage('application/pdf', 10)).toEqual({ ok: false, reason: 'unsupported-type' });
		expect(checkImage('text/html', 10)).toEqual({ ok: false, reason: 'unsupported-type' });
		expect(checkImage('image/svg+xml', 10)).toEqual({ ok: false, reason: 'unsupported-type' });
	});

	test('an oversized image is refused before it is stored', () => {
		expect(checkImage('image/png', MAX_IMAGE_BYTES + 1)).toEqual({ ok: false, reason: 'too-large' });
		expect(checkImage('image/png', MAX_IMAGE_BYTES)).toMatchObject({ ok: true });
	});
});

describe('object keys', () => {
	test('a key names its event and never repeats', () => {
		const first = headerImageKey('ev-1', 'jpg');
		const second = headerImageKey('ev-1', 'jpg');

		expect(first).toStartWith('events/ev-1/header-');
		expect(first).toEndWith('.jpg');
		expect(first).not.toBe(second);
	});

	test('a stored key is told apart from a pasted url', () => {
		expect(isStoredKey('events/ev-1/header-abc.jpg')).toBe(true);
		expect(isStoredKey('https://example.com/bild.jpg')).toBe(false);
		expect(isStoredKey('HTTP://example.com/bild.jpg')).toBe(false);
		expect(isStoredKey(null)).toBe(false);
	});
});
