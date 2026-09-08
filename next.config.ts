import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// cache components: every route ships a static shell and per-request data streams into its own
	// suspense boundary, instead of the whole page waiting on the slowest query.
	cacheComponents: true,
	// each <Link> pulls its destination's shell before the click, so a navigation has nothing left
	// to wait for. links to routes that read params or searchParams add prefetch to resolve those too.
	partialPrefetching: true,
};

export default nextConfig;
