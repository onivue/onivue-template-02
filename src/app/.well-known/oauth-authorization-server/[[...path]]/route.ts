import { auth } from '@/lib/auth/auth';

const AUTH_METADATA_PATH = '/api/auth/.well-known/oauth-authorization-server';

// RFC 8414 discovery. better-auth registers this as a real endpoint under its own base path, so
// unlike the protected-resource metadata (an onRequest hook that matches the original path) the
// url has to be pointed at the base-path form before the handler will route it.
//
// the catch-all covers both shapes a client may probe: the bare path, and the path-aware form
// RFC 8414 §3 prescribes for an issuer that has a path component (/.well-known/…/api/auth).
async function serveMetadata(request: Request): Promise<Response> {
	const target = new URL(AUTH_METADATA_PATH, new URL(request.url).origin);

	return auth.handler(new Request(target, { headers: request.headers, method: 'GET' }));
}

export async function GET(request: Request): Promise<Response> {
	return serveMetadata(request);
}

export async function HEAD(request: Request): Promise<Response> {
	return serveMetadata(request);
}
