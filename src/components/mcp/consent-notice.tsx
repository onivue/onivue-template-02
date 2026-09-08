import type { ReactNode } from 'react';

import { Bot } from 'lucide-react';

import { cn } from '@/lib/utils';

type ConsentNoticeProps = {
	action?: ReactNode;
	description: string;
	icon: typeof Bot;
	testId: string;
	title: string;
	tone?: 'neutral' | 'success';
};

// every terminal state of this screen — granted, denied, nothing to decide — is the same panel with
// a different mark on it, so none of them can drift into its own shape
const TONE_STYLE = {
	neutral: 'bg-muted text-ink-soft',
	success: 'bg-accent-strong/12 text-accent-strong',
} as const;

export function ConsentNotice({
	action,
	description,
	icon: Icon,
	testId,
	title,
	tone = 'neutral',
}: ConsentNoticeProps) {
	return (
		<div className='design-panel grid justify-items-center gap-3 p-8 text-center sm:p-10' data-testid={testId}>
			<span className={cn('flex size-14 items-center justify-center rounded-full', TONE_STYLE[tone])}>
				<Icon aria-hidden='true' className='size-7' />
			</span>
			<p className='text-xl font-bold text-foreground'>{title}</p>
			<p className='design-page-description'>{description}</p>
			{action}
		</div>
	);
}
