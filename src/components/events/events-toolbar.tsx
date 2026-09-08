'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CreateEventForm } from '@/components/events/create-event-form';
import { APP_ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

const ACTIVE_CLASS = 'bg-ink font-bold text-background';
const IDLE_CLASS = 'text-ink-soft hover:bg-muted hover:text-ink';

export const ARCHIVE_QUERY_KEY = 'archiv';
export const ARCHIVE_QUERY_VALUE = '1';

const ARCHIVE_HREF = `${APP_ROUTES.EVENTS}?${ARCHIVE_QUERY_KEY}=${ARCHIVE_QUERY_VALUE}`;

// one row, one read of the url: two boundaries could show the create field over the archive
function Toolbar({ showArchived }: { showArchived: boolean }) {
	return (
		<>
			{showArchived ? null : <CreateEventForm />}

			<nav className='flex items-center gap-1 text-sm' data-testid='events-filter'>
				<Link
					className={cn('rounded-full px-4 py-2 transition-colors', showArchived ? IDLE_CLASS : ACTIVE_CLASS)}
					data-testid='filter-active'
					href={APP_ROUTES.EVENTS}
				>
					Aktiv
				</Link>
				<Link
					className={cn('rounded-full px-4 py-2 transition-colors', showArchived ? ACTIVE_CLASS : IDLE_CLASS)}
					data-testid='filter-archived'
					href={ARCHIVE_HREF}
				>
					Archiv
				</Link>
			</nav>
		</>
	);
}

export function EventsToolbar() {
	return <Toolbar showArchived={useSearchParams().get(ARCHIVE_QUERY_KEY) === ARCHIVE_QUERY_VALUE} />;
}

export function EventsToolbarFallback() {
	return <Toolbar showArchived={false} />;
}
