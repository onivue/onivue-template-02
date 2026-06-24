import type { Metadata, Viewport } from 'next';

import { Geist_Mono, Space_Grotesk } from 'next/font/google';

import { Footer } from '@/components/layout/footer';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
	variable: '--font-space-grotesk',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'onivue',
	description: 'template',
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='de' className={`${spaceGrotesk.variable} ${geistMono.variable} h-full`}>
			<body className={`${spaceGrotesk.className} min-h-dvh antialiased`}>
				<div className='flex min-h-dvh flex-col'>
					<div className='min-h-0 flex-1'>{children}</div>
					<Footer />
				</div>
			</body>
		</html>
	);
}
