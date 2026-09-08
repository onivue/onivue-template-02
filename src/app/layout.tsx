import type { Metadata, Viewport } from 'next';

import { Analytics } from '@vercel/analytics/next';
import { Geist_Mono, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';

import { APP_CONFIG } from '@/config/app';
import { SERVER_CONFIG } from '@/config/env';
import { OG_COLORS, SITE } from '@/config/site';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
	variable: '--font-space-grotesk',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

// every page inherits this. a page sets only what is its own — the template appends the app name,
// and the opengraph-image route supplies the picture, so no page repeats either.
export const metadata: Metadata = {
	// without it every og:image and canonical url stays relative, and a messenger cannot resolve them
	metadataBase: new URL(SERVER_CONFIG.auth.origin),
	title: {
		default: `${APP_CONFIG.app.name} — ${SITE.tagline}`,
		template: `%s | ${APP_CONFIG.app.name}`,
	},
	description: SITE.description,
	applicationName: APP_CONFIG.app.name,
	appleWebApp: { capable: true, statusBarStyle: 'default', title: APP_CONFIG.app.name },
	icons: {
		apple: '/web-app-manifest-192x192.png',
		icon: [
			{ url: '/favicon.ico', sizes: 'any' },
			{ url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
		],
	},
	manifest: '/manifest.webmanifest',
	openGraph: {
		description: SITE.description,
		locale: SITE.locale,
		siteName: APP_CONFIG.app.name,
		title: `${APP_CONFIG.app.name} — ${SITE.tagline}`,
		type: 'website',
	},
	twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: OG_COLORS.background,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='de' className={`${spaceGrotesk.variable} ${geistMono.variable} h-full`}>
			<body className={`${spaceGrotesk.className} min-h-dvh antialiased`}>
				{/* each shell places its own footer and account control, next to its own content */}
				<div className='grid min-h-dvh grid-rows-[1fr]'>{children}</div>
				<Toaster richColors position='top-center' />
				<Analytics />
			</body>
		</html>
	);
}
