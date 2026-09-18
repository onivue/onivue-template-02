import { CalendarClock } from 'lucide-react';

import { EventIconTile } from '@/components/events/event-icon-tile';
import { formatBerlin } from '@/lib/events/berlin-time';

type InvitationDeadlineProps = {
	closesAt: Date;
	isAnswered: boolean;
};

// the deadline belongs to the act of answering, so it rides at the head of the answer panel rather
// than floating between the panels as a line of small print. it says two different things either
// side of the reply: when an answer is wanted, and how long it stays changeable.
export function InvitationDeadline({ closesAt, isAnswered }: InvitationDeadlineProps) {
	const date = formatBerlin(closesAt, 'end-of-day');

	return (
		<div className='flex items-center gap-3' data-testid='invitation-deadline'>
			<EventIconTile>
				<CalendarClock aria-hidden='true' className='size-5' />
			</EventIconTile>
			<div className='min-w-0'>
				<p className='text-sm leading-tight font-bold text-ink'>
					{isAnswered ? `Änderbar bis ${date}` : `Antwort bitte bis ${date}`}
				</p>
				<p className='text-xs text-ink-soft'>
					{isAnswered
						? 'Danach bleibt deine Antwort so, wie sie steht.'
						: 'Du kannst sie bis dahin jederzeit ändern.'}
				</p>
			</div>
		</div>
	);
}
