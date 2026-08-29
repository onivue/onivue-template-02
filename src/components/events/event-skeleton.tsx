import { Skeleton } from '@/components/ui/skeleton';

// the shapes the real content will take, so nothing jumps when the data lands
export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
	return (
		<div className='design-panel grid gap-3 px-4 py-4'>
			<Skeleton className='h-3 w-24' />
			{Array.from({ length: rows }, (_, index) => (
				<Skeleton className='h-4 w-full' key={index} />
			))}
		</div>
	);
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className='design-panel divide-y divide-border overflow-hidden p-0'>
			{Array.from({ length: rows }, (_, index) => (
				<div className='flex items-center justify-between gap-4 px-4 py-4' key={index}>
					<div className='grid flex-1 gap-2'>
						<Skeleton className='h-4 w-1/3' />
						<Skeleton className='h-3 w-1/2' />
					</div>
					<Skeleton className='size-8 rounded-full' />
				</div>
			))}
		</div>
	);
}
