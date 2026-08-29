import { CalendarDays, ChevronRight, Send } from 'lucide-react';
import Link from 'next/link';

import { CreateEventForm } from '@/components/events/create-event-form';
import { ResponseCounts } from '@/components/events/response-counts';
import { Badge } from '@/components/ui/badge';
import { eventPath } from '@/config/routes';
import { getActiveMembership } from '@/lib/auth/active-organization';
import { formatBerlin } from '@/lib/events/berlin-time';
import { eventRepository } from '@/lib/events/event-services';
import { cn } from '@/lib/utils';

export const metadata = {
	title: 'Events | onivue',
	description: 'Events anlegen und Einladungen verwalten.',
};

type EventsPageProps = {
	searchParams: Promise<{ archiv?: string }>;
};

const ARCHIVE_QUERY = '/events?archiv=1';

export default async function EventsPage({ searchParams }: EventsPageProps) {
	const { archiv } = await searchParams;
	const showArchived = archiv === '1';
	const membership = await getActiveMembership();
	const events = await eventRepository.listEvents(membership.organizationId, showArchived ? 'archived' : 'active');

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

			{showArchived ? null : <CreateEventForm />}

			<nav className='flex items-center gap-1 text-sm' data-testid='events-filter'>
				<Link
					className={cn(
						'rounded-full px-3 py-1.5 transition-colors',
						showArchived
							? 'text-ink-soft hover:bg-muted'
							: 'bg-sidebar-accent font-bold text-sidebar-primary'
					)}
					data-testid='filter-active'
					href='/events'
				>
					Aktiv
				</Link>
				<Link
					className={cn(
						'rounded-full px-3 py-1.5 transition-colors',
						showArchived
							? 'bg-sidebar-accent font-bold text-sidebar-primary'
							: 'text-ink-soft hover:bg-muted'
					)}
					data-testid='filter-archived'
					href={ARCHIVE_QUERY}
				>
					Archiv
				</Link>
			</nav>

			{events.length === 0 ? (
				<p className='design-panel px-4 py-8 text-center text-sm text-ink-soft' data-testid='events-empty'>
					{showArchived
						? 'Im Archiv liegt noch nichts.'
						: 'Noch kein Event. Gib oben einen Titel ein — den Rest kannst du danach in Ruhe einstellen.'}
				</p>
			) : (
				<ul className='design-panel divide-y divide-border overflow-hidden p-0' data-testid='events-list'>
					{events.map((item) => (
						<li key={item.id}>
							<Link
								className='flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/60'
								data-testid={`event-card-${item.id}`}
								href={eventPath(item.id)}
							>
								<div className='grid min-w-0 flex-1 gap-1.5'>
									<div className='flex flex-wrap items-center gap-2'>
										<h2 className='truncate text-lg font-bold'>{item.title}</h2>
										{item.status === 'archived' ? (
											<Badge variant='secondary'>Archiviert</Badge>
										) : null}
										{item.counts.unsent > 0 ? (
											<span className='flex items-center gap-1 text-xs text-ink-soft'>
												<Send aria-hidden='true' className='size-3' />
												{item.counts.unsent} nicht versendet
											</span>
										) : null}
									</div>

									<p className='flex items-center gap-1.5 text-sm text-ink-soft'>
										<CalendarDays aria-hidden='true' className='size-3.5' />
										{item.startsAt ? formatBerlin(item.startsAt) : 'Noch kein Datum'}
									</p>

									{item.counts.invitations > 0 ? (
										<ResponseCounts counts={item.counts} variant='inline' />
									) : (
										<p className='text-sm text-ink-soft'>Noch keine Einladungen</p>
									)}
								</div>

								<ChevronRight aria-hidden='true' className='size-5 shrink-0 text-ink-soft' />
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
