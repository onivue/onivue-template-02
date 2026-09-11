import { cn } from '@/lib/utils';

// the repeating shape of a landing section: a compact label, a display heading, one line of
// explanation, and the content below it — so every section is introduced the same way

function LandingSection({ className, ...props }: React.ComponentProps<'section'>) {
	return <section className={cn('grid scroll-mt-6 gap-8', className)} {...props} />;
}

function LandingSectionHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return <div className={cn('grid max-w-2xl gap-4', className)} {...props} />;
}

function LandingSectionLabel({ className, ...props }: React.ComponentProps<'span'>) {
	return <span className={cn('design-section-label w-fit px-3 py-1.5', className)} {...props} />;
}

function LandingSectionTitle({ children, className, ...props }: React.ComponentProps<'h2'>) {
	return (
		<h2 className={cn('text-3xl leading-tight font-bold text-balance text-ink sm:text-4xl', className)} {...props}>
			{children}
		</h2>
	);
}

function LandingSectionDescription({ className, ...props }: React.ComponentProps<'p'>) {
	return <p className={cn('design-page-description text-base', className)} {...props} />;
}

export { LandingSection, LandingSectionDescription, LandingSectionHeader, LandingSectionLabel, LandingSectionTitle };
