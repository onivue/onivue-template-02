import { cn } from '@/lib/utils';

type EventIconTileProps = React.ComponentProps<'span'> & {
	// the accent belongs to a panel. on the bare canvas — the date and the address above the first
	// panel — a lime tile has nothing to sit against and reads as a stray sticker, so it stays quiet.
	tone?: 'accent' | 'quiet';
};

const TONES = {
	accent: 'bg-lime-glow/25 text-accent-strong',
	quiet: 'border border-border text-ink-soft',
} as const;

// every large icon on the invitation sits in this one tile: the date, each section the host wrote,
// the calendar download, the deadline. one shape throughout, and inside a panel one colour, so a
// page that is mostly panels and words has a single accent running through it.
export function EventIconTile({ className, tone = 'accent', ...props }: EventIconTileProps) {
	return (
		<span
			aria-hidden='true'
			className={cn('grid size-10 shrink-0 place-items-center rounded-2xl', TONES[tone], className)}
			{...props}
		/>
	);
}
