import { ArrowLeft, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { EventTabs } from '@/components/events/event-tabs';
import { Badge } from '@/components/ui/badge';
import { APP_ROUTES } from '@/config/routes';
import { formatBerlin } from '@/lib/events/berlin-time';
import { loadEvent } from '@/lib/events/event-page-data';

type EventLayoutProps = {
	children: ReactNode;
	params: Promise<{ eventId: string }>;
};

export default async function EventLayout({ children, params }: EventLayoutProps) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);

	return (
		<div className='flex flex-col gap-6 py-2' data-testid='event-detail'>
			<header className='grid gap-3'>
				<Link
					className='inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink'
					href={APP_ROUTES.EVENTS}
				>
					<ArrowLeft aria-hidden='true' className='size-4' /> Alle Events
				</Link>

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
			</header>

			<EventTabs eventId={event.id} />

			{children}
		</div>
	);
}
