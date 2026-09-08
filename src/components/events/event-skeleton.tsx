import { CardSkeleton } from '@/components/ui/skeleton';

// the list holds cards, so its placeholder is cards — same column, same gap, same corners
export function EventCardsSkeleton({ cards = 3 }: { cards?: number }) {
	return (
		<div className='grid gap-4' data-testid='event-cards-skeleton'>
			{Array.from({ length: cards }, (_, index) => (
				<CardSkeleton className='h-36' key={index} />
			))}
		</div>
	);
}
