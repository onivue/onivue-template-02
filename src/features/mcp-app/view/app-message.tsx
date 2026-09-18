import { cn } from '@/lib/utils';

type TAppMessageProps = {
	className?: string;
	description?: string;
	testId: string;
	title: string;
	tone?: 'danger' | 'quiet';
};

// the one shape every empty, failed and disconnected screen takes, so they cannot drift apart
export function AppMessage({ className, description, testId, title, tone = 'quiet' }: TAppMessageProps) {
	return (
		<div
			className={cn(
				'grid gap-1 rounded-2xl border px-4 py-5 text-center',
				tone === 'danger' ? 'border-destructive/30 bg-destructive/10' : 'border-border bg-muted/40',
				className
			)}
			data-testid={testId}
		>
			<p className={cn('text-sm font-bold', tone === 'danger' ? 'text-destructive' : 'text-ink')}>{title}</p>
			{description ? <p className='text-sm text-ink-soft'>{description}</p> : null}
		</div>
	);
}
