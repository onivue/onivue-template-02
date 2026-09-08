import type { MetadataRoute } from 'next';

import { APP_ROUTES } from '@/config/routes';

// the guest route is deliberately not listed here. facebook's and whatsapp's fetchers honour
// robots.txt, so disallowing /i would stop the very link preview the host is sending — the page
// keeps itself out of search results with its own noindex instead.
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			allow: '/',
			disallow: [
				APP_ROUTES.EVENTS,
				APP_ROUTES.ACCOUNT,
				APP_ROUTES.SETTINGS,
				APP_ROUTES.CONSENT,
				'/api/',
				'/.well-known/',
			],
			userAgent: '*',
		},
	};
}
