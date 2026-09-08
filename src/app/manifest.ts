import type { MetadataRoute } from 'next';

import { APP_CONFIG } from '@/config/app';
import { OG_COLORS, SITE } from '@/config/site';

export default function manifest(): MetadataRoute.Manifest {
	return {
		background_color: OG_COLORS.background,
		description: SITE.description,
		display: 'standalone',
		// the mark sits well inside the safe zone, so the same file serves both a plain icon and the
		// circle android crops out of a maskable one. the manifest type takes one purpose per entry,
		// so each file is listed twice rather than with a combined value.
		icons: [
			{ purpose: 'any', sizes: '192x192', src: '/web-app-manifest-192x192.png', type: 'image/png' },
			{ purpose: 'maskable', sizes: '192x192', src: '/web-app-manifest-192x192.png', type: 'image/png' },
			{ purpose: 'any', sizes: '512x512', src: '/web-app-manifest-512x512.png', type: 'image/png' },
			{ purpose: 'maskable', sizes: '512x512', src: '/web-app-manifest-512x512.png', type: 'image/png' },
		],
		lang: 'de',
		name: APP_CONFIG.app.name,
		short_name: APP_CONFIG.app.name,
		start_url: '/',
		theme_color: OG_COLORS.ink,
	};
}
