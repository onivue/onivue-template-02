import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type FormFieldProps = {
	error?: string;
	id: string;
	label: string;
	// slot beside the label, e.g. the "forgot password?" link
	labelSuffix?: ReactNode;
} & ComponentProps<'input'>;

// owns the whole accessibility contract for a labelled input: the label association, the invalid
// flags, the error wiring and the test ids. call sites pass a value, never re-derive the wiring.
export function FormField({ className, error, id, label, labelSuffix, ...props }: FormFieldProps) {
	const errorId = `${id}-error`;
	const isInvalid = !!error;

	return (
		<label className='grid gap-2' htmlFor={id} data-testid={`${id}-field`} data-invalid={isInvalid}>
			{labelSuffix ? (
				<div className='flex items-center justify-between gap-2'>
					<span className='design-label'>{label}</span>
					{labelSuffix}
				</div>
			) : (
				<span className='design-label'>{label}</span>
			)}
			<input
				id={id}
				className={cn('design-input w-full', className)}
				aria-invalid={isInvalid}
				aria-describedby={isInvalid ? errorId : undefined}
				data-testid={`${id}-input`}
				{...props}
			/>
			{error ? (
				<span id={errorId} className='design-field-error px-1' data-testid={errorId}>
					{error}
				</span>
			) : null}
		</label>
	);
}
