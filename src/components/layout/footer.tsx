import { cn } from '@/lib/utils';

// every shell places this itself, directly under its own content column
export function Footer({ className, ...props }: React.ComponentProps<'footer'>) {
	return (
		<footer
			className={cn(
				'flex min-h-(--site-footer-height) items-center justify-center px-[max(1rem,env(safe-area-inset-left))] py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center',
				className
			)}
			data-testid='site-footer'
			{...props}
		>
			<p className='inline-flex items-baseline justify-center gap-1 text-xs leading-none font-medium text-ink-soft'>
				<span>created by</span>
				<a
					href='https://onivue.ch'
					target='_blank'
					rel='noreferrer'
					className='rounded-sm font-bold text-ink underline-offset-4 outline-none transition-colors hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
				>
					onivue
				</a>
			</p>
		</footer>
	);
}
