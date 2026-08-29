// the port for stored files. neon object storage is s3-compatible, but nothing above this line
// needs to know that — and nothing above it needs to know whether storage is configured at all.

export type StoredObject = {
	body: Uint8Array;
	contentType: string;
	key: string;
};

export type ObjectStorage = {
	// a signed url the browser may load directly; short-lived, because the bucket stays private.
	// storage that is not configured is a null ObjectStorage, never a null url.
	readUrl(key: string, expiresInSeconds: number): Promise<string>;
	remove(key: string): Promise<void>;
	upload(object: StoredObject): Promise<void>;
};

const IMAGE_TYPES = new Map([
	['image/avif', 'avif'],
	['image/gif', 'gif'],
	['image/jpeg', 'jpg'],
	['image/png', 'png'],
	['image/webp', 'webp'],
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageRejection = 'too-large' | 'unsupported-type';

export type ImageCheck = { extension: string; ok: true } | { ok: false; reason: ImageRejection };

// what may enter the bucket: a handful of image types, small enough to sit at the top of a page
export function checkImage(contentType: string, size: number): ImageCheck {
	const extension = IMAGE_TYPES.get(contentType.toLowerCase());

	if (!extension) {
		return { ok: false, reason: 'unsupported-type' };
	}

	if (size > MAX_IMAGE_BYTES) {
		return { ok: false, reason: 'too-large' };
	}

	return { extension, ok: true };
}

// the key carries the event, so a stray object is traceable, and a random segment, so one guest
// cannot walk from their own image to another event's
export function headerImageKey(eventId: string, extension: string): string {
	return `events/${eventId}/header-${crypto.randomUUID()}.${extension}`;
}

const ABSOLUTE_URL = /^https?:\/\//i;

// the column holds either a bucket key or a plain url someone pasted before uploads existed
export function isStoredKey(value: null | string): value is string {
	return Boolean(value) && !ABSOLUTE_URL.test(value ?? '');
}
