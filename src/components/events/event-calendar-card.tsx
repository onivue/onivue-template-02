import { CalendarPlus, Download } from 'lucide-react';

import type { EventSchedule } from '@/lib/events/event-schedule';

import { cn } from '@/lib/utils';

type EventCalendarCardProps = {
	className?: string;
	href: string;
	schedule: EventSchedule | null;
};

const SEPARATOR = ' · ';

// the ics download, given the same weight as the address: somebody who is coming wants the date in
// their own calendar, and a text link between two tiles is the one thing they would miss
export function EventCalendarCard({ className, href, schedule }: EventCalendarCardProps) {
	if (!schedule) {
		return null;
	}

	const when = [schedule.date, schedule.time, schedule.until].filter(Boolean).join(SEPARATOR);

	return (
		<a
			className={cn(
				'group flex items-center gap-4 rounded-3xl border border-border bg-surface-elevated p-5 transition-colors hover:bg-muted',
				className
			)}
			data-testid='invitation-add-to-calendar'
			download
			href={href}
		>
			<span className='grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-ink-soft transition-colors group-hover:bg-lime-glow/25 group-hover:text-accent-strong'>
				<CalendarPlus aria-hidden='true' className='size-5' />
			</span>

			<span className='min-w-0 flex-1'>
				<span className='block text-base leading-tight font-bold text-ink'>Zum Kalender hinzufügen</span>
				<span className='block text-sm text-ink-soft'>{when}</span>
			</span>

			<Download aria-hidden='true' className='size-4 shrink-0 text-ink-soft' />
		</a>
	);
}
