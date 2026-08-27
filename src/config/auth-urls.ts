// pure url derivation, kept apart from the env module so it stays testable and client-safe

const LOOPBACK_HOSTNAME = '127.0.0.1';
const LOOPBACK_RP_ID = 'localhost';

export type AuthUrls = {
	origin: string;
	passkeyRpId: string;
};

// derived once from the validated base url, rather than recomputed per call site
export function deriveAuthUrls(baseUrl: string): AuthUrls {
	const { hostname, origin } = new URL(baseUrl);

	return {
		origin,
		passkeyRpId: hostname === LOOPBACK_HOSTNAME ? LOOPBACK_RP_ID : hostname,
	};
}
