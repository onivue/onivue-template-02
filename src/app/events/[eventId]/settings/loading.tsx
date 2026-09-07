import { PanelSkeleton } from '@/components/events/event-skeleton';

export default function SectionLoading() {
	return (
		<div className='grid gap-4' data-testid='section-loading'>
			<PanelSkeleton rows={6} />
			<PanelSkeleton rows={3} />
		</div>
	);
}
