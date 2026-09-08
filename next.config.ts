import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// cache components: every route ships a static shell and per-request data streams into its own
	// suspense boundary, instead of the whole page waiting on the slowest query.
	//
	// partialPrefetching stays off. it prerenders each route again per link, with cookies resolved —
	// which starts session and event queries that the prerender then aborts, leaving the reader on a
	// skeleton and a viewer that failed to load looking like a signed-out one.
	cacheComponents: true,
	experimental: {
		// the client cache keeps a visited page's payload for half a minute, so going back to the
		// event list or switching between the two event tabs reuses it instead of refetching. the
		// default is 0, which is why every navigation looked like a cold load. mutations are not
		// affected: updateTag() in a server action refreshes the route the caller is on.
		staleTimes: {
			dynamic: 30,
		},
	},
};

export default nextConfig;
