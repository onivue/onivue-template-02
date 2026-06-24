import { cn } from '@/lib/utils';

type FooterPlacement = 'root' | 'sidebar';

type FooterProps = React.ComponentProps<'footer'> & {
	placement?: FooterPlacement;
};

export function Footer({ className, placement = 'root', ...props }: FooterProps) {
	return (
		<footer
			className={cn('design-footer', placement === 'sidebar' ? 'design-footer-sidebar' : null, className)}
			data-footer-placement={placement}
			data-testid={`${placement}-site-footer`}
			{...props}
		>
			<p className='design-footer-credit'>
				<span>created by</span>
				<a href='https://onivue.ch' target='_blank' rel='noreferrer' className='design-footer-link'>
					onivue
				</a>
			</p>
		</footer>
	);
}
