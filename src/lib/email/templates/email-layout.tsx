import type { ReactNode } from 'react';

import { Body, Container, Head, Hr, Html, Preview, Section, Tailwind, Text } from '@react-email/components';

import { EMAIL_APP_NAME, EMAIL_COLORS } from '@/lib/email/templates/theme';

type EmailLayoutProps = {
	children: ReactNode;
	previewText: string;
};

// react-email inlines every style at render time, so the tailwind config here
// is restated (not imported from globals.css) and font-sans stays system fonts —
// email clients don't reliably load the app's web font
export function EmailLayout({ children, previewText }: EmailLayoutProps) {
	return (
		<Html lang='de'>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind config={{ theme: { extend: { colors: EMAIL_COLORS } } }}>
				<Body className='m-0 bg-background py-10 font-sans'>
					<Container className='mx-auto w-full max-w-120 px-6'>
						<Section className='mb-6 px-2'>
							<Text className='m-0 text-[15px] font-bold tracking-tight text-ink'>
								{EMAIL_APP_NAME}
								<span className='text-lime'>.</span>
							</Text>
						</Section>
						<Section className='rounded-3xl border border-solid border-border bg-surface px-8 py-10'>
							{children}
						</Section>
						<Section className='mt-6 px-2'>
							<Hr className='mb-4 border-border' />
							<Text className='m-0 text-[12px] leading-5 text-ink-soft'>
								Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
							</Text>
							<Text className='m-0 mt-2 text-[12px] leading-5 text-ink-soft'>
								© {new Date().getFullYear()} {EMAIL_APP_NAME}
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
