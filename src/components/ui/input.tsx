import { Input as InputPrimitive } from '@base-ui/react/input';
import * as React from 'react';

import { cn } from '@/lib/utils';

// the design comes with the control, not from the call site — that is what keeps every field in the
// app at the same height
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<InputPrimitive
			type={type}
			data-slot='input'
			className={cn('design-input w-full min-w-0', className)}
			{...props}
		/>
	);
}

export { Input };
