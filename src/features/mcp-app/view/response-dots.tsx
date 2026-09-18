import { cn } from '@/lib/utils';

type TResponseDotsProps = {
	className?: string;
	counts: { accepted: number; declined: number; open: number };
};

// the same three segments, colours and wording the app's own ResponseCounts uses, at list size
const SEGMENTS = [
	{ fill: 'bg-accent-strong', key: 'accepted', label: 'zugesagt' },
	{ fill: 'bg-border', key: 'open', label: 'offen' },
	{ fill: 'bg-foreground/30', key: 'declined', label: 'abgesagt' },
] as const;

export function ResponseDots({ className, counts }: TResponseDotsProps) {
	return (
		<div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)} data-testid='response-dots'>
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
}
