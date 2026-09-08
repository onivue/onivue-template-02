import { CalendarDays, Send } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { EventCardsSkeleton } from '@/components/events/event-skeleton';
import {
	ARCHIVE_QUERY_KEY,
	ARCHIVE_QUERY_VALUE,
	EventsToolbar,
	EventsToolbarFallback,
} from '@/components/events/events-toolbar';
import { ResponseCounts } from '@/components/events/response-counts';
import { Badge } from '@/components/ui/badge';
import { eventPath } from '@/config/routes';
import { getActiveMembership } from '@/lib/auth/active-organization';
import { formatBerlin } from '@/lib/events/berlin-time';
import { eventRepository } from '@/lib/events/event-services';

export const metadata = {
	title: 'Events',
	description: 'Events anlegen und Einladungen verwalten.',
};

type SearchParams = Promise<{ archiv?: string }>;

async function isArchiveView(searchParams: SearchParams): Promise<boolean> {
	return (await searchParams)[ARCHIVE_QUERY_KEY] === ARCHIVE_QUERY_VALUE;
}

async function EventList({ searchParams }: { searchParams: SearchParams }) {
	const showArchived = await isArchiveView(searchParams);
	const membership = await getActiveMembership();
	const events = await eventRepository.listEvents(membership.organizationId, showArchived ? 'archived' : 'active');

	if (events.length === 0) {
		return (
			<p className='design-panel px-6 py-10 text-center text-sm text-ink-soft' data-testid='events-empty'>
				{showArchived
					? 'Im Archiv liegt noch nichts.'
					: 'Noch kein Event. Gib oben einen Titel ein — den Rest kannst du danach in Ruhe einstellen.'}
			</p>
		);
	}

	return (
		<ul className='grid gap-4' data-testid='events-list'>
			{events.map((item) => (
				<li className='grid' key={item.id}>
					<Link
						className='design-panel grid content-start gap-3 p-5 transition-colors hover:bg-muted/50'
						data-testid={`event-card-${item.id}`}
						href={eventPath(item.id)}
					>
						<div className='flex items-start justify-between gap-2'>
							<h2 className='text-lg leading-tight font-bold text-balance'>{item.title}</h2>
							{item.status === 'archived' ? <Badge variant='secondary'>Archiviert</Badge> : null}
						</div>

						<p className='flex items-center gap-1.5 text-sm text-ink-soft'>
							<CalendarDays aria-hidden='true' className='size-3.5 shrink-0' />
							{item.startsAt ? formatBerlin(item.startsAt) : 'Noch kein Datum'}
						</p>

						<div className='mt-1 grid gap-1.5 border-t border-border pt-3'>
							{item.counts.invitations > 0 ? (
								<ResponseCounts counts={item.counts} variant='inline' />
							) : (
								<p className='text-sm text-ink-soft'>Noch keine Einladungen</p>
							)}

							{item.counts.unsent > 0 ? (
								<span className='flex items-center gap-1.5 text-xs text-ink-soft'>
									<Send aria-hidden='true' className='size-3 shrink-0' />
									{item.counts.unsent} nicht versendet
								</span>
							) : null}
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}

// nothing is awaited here: the title belongs to the shell, only the cards below stream in
export default function EventsPage({ searchParams }: { searchParams: SearchParams }) {
	return (
		<div className='flex flex-col gap-6 py-2' data-testid='events-page'>
			<header className='grid max-w-2xl gap-3'>
				<p className='design-section-label w-fit px-3 py-1.5'>Events</p>
				<div className='grid gap-2'>
					<h1 className='design-page-title text-[clamp(2rem,5vw,3.5rem)]'>Events</h1>
					<p className='design-page-description'>
						Lege ein Event an, trage die Gäste ein und verschicke die Einladungslinks, wie du möchtest.
					</p>
				</div>
			</header>

			<Suspense fallback={<EventsToolbarFallback />}>
				<EventsToolbar />
			</Suspense>

			<Suspense fallback={<EventCardsSkeleton />}>
				<EventList searchParams={searchParams} />
			</Suspense>
		</div>
	);
}
