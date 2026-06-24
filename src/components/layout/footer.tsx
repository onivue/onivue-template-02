import { cn } from '@/lib/utils';

type FooterPlacement = 'root' | 'sidebar';

type FooterProps = React.ComponentProps<'footer'> & {
	placement?: FooterPlacement;
};

export function Footer({ className, placement = 'root', ...props }: FooterProps) {
	const isSidebar = placement === 'sidebar';

	return (
		<footer
			className={cn(
				'flex min-h-[var(--site-footer-height)] items-center justify-center text-center [padding:0.5rem_max(1rem,env(safe-area-inset-left))_max(0.5rem,env(safe-area-inset-bottom))_max(1rem,env(safe-area-inset-right))]',
				isSidebar ? 'mt-auto min-h-0 border-t border-sidebar-border px-1 pt-[0.85rem] pb-[0.15rem]' : null,
				className
			)}
			data-footer-placement={placement}
			data-testid={`${placement}-site-footer`}
			{...props}
		>
			<p
				className={cn(
					'inline-flex items-baseline justify-center gap-[0.3rem] text-[0.7rem] leading-none font-semibold text-[color-mix(in_oklch,var(--ink-soft)_72%,transparent)]',
					isSidebar ? 'text-[0.68rem] text-[oklch(0.97_0.004_106_/_42%)]' : null
				)}
			>
				<span>created by</span>
				<a
					href='https://onivue.ch'
					target='_blank'
					rel='noreferrer'
					className={cn(
						'font-extrabold text-[color-mix(in_oklch,var(--ink)_76%,transparent)] no-underline outline-none transition-colors hover:text-[var(--ink)] focus-visible:rounded-full focus-visible:shadow-[0_0_0_3px_oklch(0.91_0.23_126_/_22%)]',
						isSidebar ? 'text-[oklch(0.97_0.004_106_/_72%)] hover:text-sidebar-accent' : null
					)}
				>
					onivue
				</a>
			</p>
		</footer>
	);
}
