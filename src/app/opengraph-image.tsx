import { ImageResponse } from 'next/og';

import { APP_CONFIG } from '@/config/app';
import { OG_COLORS, OG_SIZE, SITE } from '@/config/site';

export const alt = `${APP_CONFIG.app.name} — ${SITE.tagline}`;
export const contentType = 'image/png';
export const size = OG_SIZE;

// the preview card every route falls back to. an invitation keeps this picture and carries its own
// title and date in the text beside it, which is what a messenger actually reads out.
export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				background: OG_COLORS.background,
				color: OG_COLORS.ink,
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				justifyContent: 'space-between',
				padding: '80px',
				width: '100%',
			}}
		>
			<div style={{ background: OG_COLORS.accent, borderRadius: 999, height: 14, width: 148 }} />

			<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
				<div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>
					{APP_CONFIG.app.name}
				</div>
				<div style={{ color: OG_COLORS.inkSoft, fontSize: 40, lineHeight: 1.3, maxWidth: 900 }}>
					{SITE.tagline}
				</div>
			</div>

			<div style={{ color: OG_COLORS.inkSoft, display: 'flex', fontSize: 28 }}>{SITE.description}</div>
		</div>,
		size
	);
}
