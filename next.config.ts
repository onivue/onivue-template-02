import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// cache components: every route ships a static shell and per-request data streams into its own
	// suspense boundary, instead of the whole page waiting on the slowest query.
	//
	// partialPrefetching stays off. it prerenders each route again per link, with cookies resolved —
	// which starts session and event queries that the prerender then aborts, leaving the reader on a
	// skeleton and a viewer that failed to load looking like a signed-out one.
	cacheComponents: true,
};

export default nextConfig;
