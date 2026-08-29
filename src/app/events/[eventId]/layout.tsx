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
		<div className='flex flex-col gap-5 py-2' data-testid='event-detail'>
			<header className='grid gap-3'>
				<Link className='design-section-label w-fit px-3 py-1.5' href={APP_ROUTES.EVENTS}>
					← Alle Events
				</Link>
				<div className='flex flex-wrap items-center gap-3'>
					<h1 className='design-page-title text-[clamp(1.75rem,4vw,3rem)]'>{event.title}</h1>
					{event.status === 'archived' ? <Badge variant='secondary'>Archiviert</Badge> : null}
				</div>
				{event.startsAt ? <p className='design-page-description'>{formatBerlin(event.startsAt)}</p> : null}
			</header>

			<EventTabs eventId={event.id} />

			{children}
		</div>
	);
}
