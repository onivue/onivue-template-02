import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { APP_CONFIG } from '@/config/app';
import { OG_COLORS, OG_SIZE, SITE } from '@/config/site';

export const alt = `${APP_CONFIG.app.name} — ${SITE.tagline}`;
export const contentType = 'image/png';
export const size = OG_SIZE;

// the app's own face, read once at module scope — it does not depend on the request, and bundling it
// keeps the image from reaching for the network while it renders
const spaceGrotesk = await readFile(join(process.cwd(), 'src/assets/fonts/space-grotesk-bold.ttf'));

// the card a messenger puts above the title and date it already prints, so it carries the brand and
// nothing else: accent surface, wordmark, one line.
export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				alignItems: 'flex-start',
				background: OG_COLORS.accent,
				color: OG_COLORS.ink,
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				justifyContent: 'center',
				padding: '0 90px',
				width: '100%',
			}}
		>
			{/* sized so the wordmark keeps its margin at the length the name has room to grow to */}
			<div style={{ fontSize: 118, letterSpacing: -4, lineHeight: 1 }}>{APP_CONFIG.app.name}</div>
			<div style={{ fontSize: 34, letterSpacing: -0.5, marginTop: 16, opacity: 0.72 }}>{SITE.tagline}</div>
		</div>,
		{ ...size, fonts: [{ data: spaceGrotesk, name: 'Space Grotesk', style: 'normal', weight: 700 }] }
	);
}
