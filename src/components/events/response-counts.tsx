import { cn } from '@/lib/utils';

type Counts = {
	accepted: number;
	declined: number;
	invitations?: number;
	open: number;
	unsent?: number;
};

type ResponseCountsProps = {
	className?: string;
	counts: Counts;
	// inline sits inside a list row and stays quiet; panel is the headline of a page
	variant?: 'inline' | 'panel';
};

const SEGMENTS = [
	{ fill: 'bg-accent-strong', key: 'accepted', label: 'zugesagt' },
	{ fill: 'bg-border', key: 'open', label: 'offen' },
	{ fill: 'bg-foreground/30', key: 'declined', label: 'abgesagt' },
] as const;

// the host's daily question is "how many are coming, and who is still missing". a bar answers it
// before a single number is read, which lets the numbers themselves stay small.
export function ResponseCounts({ className, counts, variant = 'panel' }: ResponseCountsProps) {
	const total = counts.accepted + counts.open + counts.declined;

	const legend = (
		<div className='flex flex-wrap items-center gap-x-4 gap-y-1' data-testid='response-counts'>
			{SEGMENTS.map((segment) => (
				<span
					className='flex items-center gap-1.5 text-sm'
					data-testid={`count-${segment.key}`}
					key={segment.key}
				>
					<span aria-hidden='true' className={cn('size-2 rounded-full', segment.fill)} />
					<span className='font-bold tabular-nums'>{counts[segment.key]}</span>
					<span className='text-ink-soft'>{segment.label}</span>
				</span>
			))}
		</div>
	);

	if (variant === 'inline') {
		return <div className={className}>{legend}</div>;
	}

	return (
		<section className={cn('design-panel grid gap-3 px-4 py-4', className)}>
			<div className='flex flex-wrap items-baseline justify-between gap-2'>
				<h2 className='design-label'>Antworten</h2>
				{counts.invitations === undefined ? null : (
					<p className='text-xs text-ink-soft' data-testid='count-invitations'>
						{counts.invitations} Einladung{counts.invitations === 1 ? '' : 'en'}
						{counts.unsent ? ` · ${counts.unsent} noch nicht versendet` : ''}
					</p>
				)}
			</div>

			{/* decorative: the legend below states the same numbers in text */}
			{total > 0 ? (
				<div
					aria-hidden='true'
					className='flex h-2 overflow-hidden rounded-full bg-muted'
					data-testid='response-bar'
				>
					{SEGMENTS.map((segment) => (
						<span
							className={segment.fill}
							key={segment.key}
							style={{ width: `${(counts[segment.key] / total) * 100}%` }}
						/>
					))}
				</div>
			) : null}

			{legend}
		</section>
	);
}
