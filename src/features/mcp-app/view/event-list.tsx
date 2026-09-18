import { CalendarDays, ChevronRight, RefreshCw } from 'lucide-react';

import type { TEventsState } from '@/features/mcp-app/view/use-events-app';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AppMessage } from '@/features/mcp-app/view/app-message';
import { formatEventDate } from '@/features/mcp-app/view/event-date';
import { ResponseDots } from '@/features/mcp-app/view/response-dots';

type TEventListProps = {
	onOpen: (eventId: string) => void;
	onReload: () => void;
	state: TEventsState;
};

function EventListSkeleton() {
	return (
		<div className='grid gap-2' data-testid='event-list-skeleton'>
			{[0, 1, 2].map((row) => (
				<Skeleton className='h-20 rounded-2xl' key={row} />
			))}
		</div>
	);
}

export function EventList({ onOpen, onReload, state }: TEventListProps) {
	return (
		<section className='grid gap-4' data-testid='event-list'>
			<header className='flex items-center justify-between gap-3'>
				<h1 className='text-xl leading-tight font-bold text-ink'>Deine Events</h1>
				<Button data-testid='reload-events' onClick={onReload} size='sm' variant='outline'>
					<RefreshCw />
					Neu laden
				</Button>
			</header>

			{state.kind === 'loading' ? <EventListSkeleton /> : null}

			{state.kind === 'failed' ? (
				<AppMessage
					description={state.message}
					testId='event-list-error'
					title='Die Events konnten nicht geladen werden.'
					tone='danger'
				/>
			) : null}

			{state.kind === 'ready' && state.events.length === 0 ? (
				<AppMessage
					description='Sobald du ein Event anlegst, steht es hier.'
					testId='event-list-empty'
					title='Noch keine Events.'
				/>
			) : null}

			{state.kind === 'ready' && state.events.length > 0 ? (
				<ul className='grid gap-2'>
					{state.events.map((item) => {
						const date = formatEventDate(item.startsAt);

						return (
							<li key={item.id}>
								<button
									className='flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-left transition-colors outline-none hover:border-ink/25 hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
									data-testid={`event-row-${item.id}`}
									onClick={() => onOpen(item.id)}
									type='button'
								>
									<span className='grid min-w-0 flex-1 gap-1.5'>
										<span className='flex flex-wrap items-center gap-2'>
											<span className='truncate font-bold text-ink'>{item.title}</span>
											{item.status === 'archived' ? (
												<Badge variant='outline'>archiviert</Badge>
											) : null}
										</span>

										{date ? (
											<span className='flex items-center gap-1.5 text-sm text-ink-soft'>
												<CalendarDays aria-hidden='true' className='size-3.5' />
												{date}
											</span>
										) : (
											<span className='text-sm text-ink-soft'>Noch kein Termin</span>
										)}

										<ResponseDots counts={item} />
									</span>

									<ChevronRight aria-hidden='true' className='size-4 shrink-0 text-ink-soft' />
								</button>
							</li>
						);
					})}
				</ul>
			) : null}
		</section>
	);
}
