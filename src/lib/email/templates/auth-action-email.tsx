import { Link, Section, Text } from '@react-email/components';

import type { AuthEmailContent } from '@/lib/email/templates/content';

import { EmailButton } from '@/lib/email/templates/email-button';
import { EmailLayout } from '@/lib/email/templates/email-layout';

type AuthActionEmailProps = AuthEmailContent & {
	url: string;
};

// one layout for every auth email kind — the copy and cta are data, so the
// markup doesn't get re-implemented per template
export function AuthActionEmail({
	body,
	ctaLabel,
	eyebrow,
	heading,
	linkFallbackLabel,
	previewText,
	url,
}: AuthActionEmailProps) {
	return (
		<EmailLayout previewText={previewText}>
			<Text className='m-0 inline-block rounded-full bg-lime-soft px-3 py-1 text-[11px] font-bold tracking-wide text-accent-strong uppercase'>
				{eyebrow}
			</Text>
			<Text className='mt-4 mb-2 text-[24px] leading-tight font-bold text-ink'>{heading}</Text>
			<Text className='m-0 text-[14px] leading-6 text-ink-soft'>{body}</Text>
			<Section className='mt-7 mb-1'>
				<EmailButton href={url}>{ctaLabel}</EmailButton>
			</Section>
			<Text className='mt-6 mb-1 text-[12px] leading-5 text-ink-soft'>{linkFallbackLabel}</Text>
			<Link href={url} className='text-[12px] leading-5 break-all text-accent-strong'>
				{url}
			</Link>
		</EmailLayout>
	);
}
