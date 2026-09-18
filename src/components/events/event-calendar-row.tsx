import { CalendarPlus, Download } from 'lucide-react';

import type { EventSchedule } from '@/lib/events/event-schedule';

import { EventIconTile } from '@/components/events/event-icon-tile';
import { cn } from '@/lib/utils';

type EventCalendarRowProps = {
	className?: string;
	href: string;
	schedule: EventSchedule | null;
};

const SEPARATOR = ' · ';

// the ics download, one row of the panel that says what happens next: somebody who is coming wants
// the date in their own calendar, and a text link under the address is the one thing they would
// miss. the negative margin gives the link a hit area past the row without moving the row itself.
export function EventCalendarRow({ className, href, schedule }: EventCalendarRowProps) {
	if (!schedule) {
		return null;
	}

	const when = [schedule.date, schedule.time, schedule.until].filter(Boolean).join(SEPARATOR);

	return (
		<a
			className={cn(
				'group -m-2 flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-muted',
				className
			)}
			data-testid='invitation-add-to-calendar'
			download
			href={href}
		>
			<EventIconTile className='transition-colors group-hover:bg-lime-glow/45'>
				<CalendarPlus aria-hidden='true' className='size-5' />
			</EventIconTile>

			<span className='min-w-0 flex-1'>
				<span className='block text-base leading-tight font-bold text-ink'>Zum Kalender hinzufügen</span>
				<span className='block text-sm text-ink-soft'>{when}</span>
			</span>

			<Download aria-hidden='true' className='size-4 shrink-0 text-ink-soft' />
		</a>
	);
}
