import { auth } from '@/lib/auth/auth';

// RFC 9728 requires the protected-resource metadata at the resource's root well-known path, but
// better-auth is mounted under /api/auth. the mcp plugin matches on the *original* request path,
// so the request is forwarded unchanged rather than rewritten.
export async function GET(request: Request): Promise<Response> {
	return auth.handler(request);
}

export async function HEAD(request: Request): Promise<Response> {
	return auth.handler(request);
}
