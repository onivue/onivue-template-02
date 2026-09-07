// the token in a guest link. possession of it is the whole authorization (ADR-0004), so it is
// generated from a cryptographic source and long enough that guessing is pointless.

const TOKEN_BYTES = 16;
const BASE64_PADDING = /=+$/;

export type RandomBytes = (size: number) => Uint8Array;

const cryptoRandomBytes: RandomBytes = (size) => crypto.getRandomValues(new Uint8Array(size));

function toBase64Url(bytes: Uint8Array): string {
	const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');

	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(BASE64_PADDING, '');
}

// 128 bits, url-safe, 22 characters
export function createInvitationToken(randomBytes: RandomBytes = cryptoRandomBytes): string {
	return toBase64Url(randomBytes(TOKEN_BYTES));
}
