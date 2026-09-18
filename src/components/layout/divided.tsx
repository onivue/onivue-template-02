import { Children, Fragment } from 'react';

import { cn } from '@/lib/utils';

// one panel holding several blocks, each parted from the next by a hairline: the guests on an
// invitation, the sections a host wrote, the answer being read back. the rule is drawn between
// what is actually rendered, so a block that decided against rendering leaves no line behind.

function Hairline({ className }: React.ComponentProps<'span'>) {
	return <span aria-hidden='true' className={cn('h-px w-full bg-border', className)} />;
}

function Divided({ children, className, ...props }: React.ComponentProps<'div'>) {
	// toArray drops null and false for us, which is what keeps the rules honest
	const blocks = Children.toArray(children);

	return (
		<div className={cn('grid gap-5', className)} {...props}>
			{blocks.map((block, index) => (
				<Fragment key={index}>
					{index > 0 ? <Hairline /> : null}
					{block}
				</Fragment>
			))}
		</div>
	);
}

export { Divided };
