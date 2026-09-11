import { CalendarDays, MapPin } from 'lucide-react';

import type { EventAddress } from '@/lib/events/event-location';
import type { EventSchedule } from '@/lib/events/event-schedule';

import { addressLines } from '@/lib/events/event-location';

type InvitationFactsProps = {
	address: EventAddress;
	schedule: EventSchedule | null;
};

// the two answers a guest looks for before reading a single word of the greeting. they get the
// weight of a headline rather than a line of metadata.
function Fact({
	icon: Icon,
	lines,
	testId,
	title,
}: {
	icon: typeof MapPin;
	lines: string[];
	testId: string;
	title: string;
}) {
	return (
		<div className='flex items-center gap-3 text-left' data-testid={testId}>
			<span className='grid size-10 shrink-0 place-items-center rounded-2xl border border-border text-ink-soft'>
				<Icon aria-hidden='true' className='size-5' />
			</span>
			<div className='min-w-0'>
				<p className='text-base leading-tight font-bold text-ink'>{title}</p>
				{lines.map((line) => (
					<p className='text-sm leading-snug text-ink-soft' key={line}>
						{line}
					</p>
				))}
			</div>
		</div>
	);
}

export function InvitationFacts({ address, schedule }: InvitationFactsProps) {
	const [locationHeadline, ...locationRest] = addressLines(address);

	if (!schedule && !locationHeadline) {
		return null;
	}

	return (
		<div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6'>
			{schedule ? (
				<Fact
					icon={CalendarDays}
					lines={[schedule.time, schedule.until].filter((line): line is string => Boolean(line))}
					testId='invitation-when'
					title={schedule.date}
				/>
			) : null}

			{schedule && locationHeadline ? (
				<span aria-hidden='true' className='hidden h-10 w-px shrink-0 bg-border sm:block' />
			) : null}

			{locationHeadline ? (
				<Fact icon={MapPin} lines={locationRest} testId='invitation-where' title={locationHeadline} />
			) : null}
		</div>
	);
}
