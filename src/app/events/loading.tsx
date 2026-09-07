import { ListSkeleton, PanelSkeleton } from '@/components/events/event-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsLoading() {
	return (
		<div className='flex flex-col gap-6 py-2' data-testid='events-loading'>
			<div className='grid gap-3'>
				<Skeleton className='h-6 w-20 rounded-full' />
				<Skeleton className='h-12 w-56' />
			</div>
			<PanelSkeleton rows={1} />
			<ListSkeleton />
		</div>
	);
}
