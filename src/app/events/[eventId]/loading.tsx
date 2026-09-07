import { ListSkeleton, PanelSkeleton } from '@/components/events/event-skeleton';

export default function EventSectionLoading() {
	return (
		<div className='grid gap-4' data-testid='event-section-loading'>
			<PanelSkeleton rows={2} />
			<PanelSkeleton rows={4} />
			<ListSkeleton rows={3} />
		</div>
	);
}
