import { cn } from '@/lib/utils';

// the repeating shape of a page section: a heading with an optional line of explanation, an
// optional action on the right, and the content below it. used wherever a page carries more than
// one topic, so every section is introduced the same way.

function Section({ className, ...props }: React.ComponentProps<'section'>) {
	return <section className={cn('grid scroll-mt-4 gap-3', className)} {...props} />;
}

function SectionHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-2', className)} {...props} />;
}

function SectionHeading({ className, ...props }: React.ComponentProps<'div'>) {
	return <div className={cn('grid gap-0.5', className)} {...props} />;
}

function SectionTitle({ children, className, ...props }: React.ComponentProps<'h2'>) {
	return (
		<h2 className={cn('text-lg leading-tight font-bold text-ink', className)} {...props}>
			{children}
		</h2>
	);
}

function SectionDescription({ className, ...props }: React.ComponentProps<'p'>) {
	return <p className={cn('text-sm text-ink-soft', className)} {...props} />;
}

export { Section, SectionDescription, SectionHeader, SectionHeading, SectionTitle };
