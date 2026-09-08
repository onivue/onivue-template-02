import { CalendarDays } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBerlin } from '@/lib/events/berlin-time';
import { loadEvent } from '@/lib/events/event-page-data';

type EventHeaderProps = {
	params: Promise<{ eventId: string }>;
};

export async function EventHeader({ params }: EventHeaderProps) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);

	return (
		<>
			<div className='flex flex-wrap items-center gap-3'>
				<h1 className='design-page-title text-[clamp(1.75rem,4vw,3rem)]'>{event.title}</h1>
				{event.status === 'archived' ? <Badge variant='secondary'>Archiviert</Badge> : null}
			</div>

			{event.startsAt ? (
				<p className='flex items-center gap-2 text-sm text-ink-soft'>
					<CalendarDays aria-hidden='true' className='size-4 shrink-0' />
					{formatBerlin(event.startsAt)}
				</p>
			) : null}
		</>
	);
}

export function EventHeaderSkeleton() {
	return (
		<>
			<Skeleton className='h-[clamp(1.75rem,4vw,3rem)] w-72 max-w-full' />
			<Skeleton className='h-5 w-48' />
		</>
	);
}
