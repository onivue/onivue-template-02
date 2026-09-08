import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot='skeleton' className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

// a skeleton says a block of this size is on its way, and nothing else. drawing labels and text
// lines inside it competes with the real content that replaces them a moment later.
function CardSkeleton({ className, ...props }: React.ComponentProps<'div'>) {
	return <Skeleton className={cn('h-56 w-full rounded-3xl', className)} data-testid='card-skeleton' {...props} />;
}

export { CardSkeleton, Skeleton };
