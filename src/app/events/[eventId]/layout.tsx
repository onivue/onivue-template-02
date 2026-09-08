import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, Suspense } from 'react';

import { EventHeader, EventHeaderSkeleton } from '@/components/events/event-header';
import { EventTabs, EventTabsFallback } from '@/components/events/event-tabs';
import { APP_ROUTES } from '@/config/routes';

type EventLayoutProps = {
	children: ReactNode;
	params: Promise<{ eventId: string }>;
};

// nothing is awaited here: the back link and the tabs are the same for every event, only the title waits
export default function EventLayout({ children, params }: EventLayoutProps) {
	return (
		<div className='flex flex-col gap-6 py-2' data-testid='event-detail'>
			<header className='grid gap-3'>
				<Link
					className='inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink'
					href={APP_ROUTES.EVENTS}
				>
					<ArrowLeft aria-hidden='true' className='size-4' /> Alle Events
				</Link>

				<Suspense fallback={<EventHeaderSkeleton />}>
					<EventHeader params={params} />
				</Suspense>
			</header>

			<Suspense fallback={<EventTabsFallback />}>
				<EventTabs />
			</Suspense>

			{children}
		</div>
	);
}
