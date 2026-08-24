import { type ComponentProps, type ReactNode } from 'react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AuthCardProps = {
	children: ReactNode;
	className?: string;
	description: string;
	footer?: ReactNode;
	testId: string;
	title: string;
};

type AuthDividerProps = {
	label: string;
};

type AuthEmailFieldProps = {
	error?: string;
	id: string;
	label: string;
	placeholder: string;
} & ComponentProps<'input'>;

export function AuthCard({ children, className, description, footer, testId, title }: AuthCardProps) {
	return (
		<Card
			className={cn(
				'w-full max-w-md gap-5 rounded-3xl border border-border bg-surface-elevated px-6 py-7 ring-0 has-data-[slot=card-footer]:pb-7 sm:px-8 sm:py-8 sm:has-data-[slot=card-footer]:pb-8',
				'shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_8%,transparent)]',
				className
			)}
			data-testid={testId}
		>
			<CardHeader className='gap-2 px-0'>
				<CardTitle className='font-heading text-2xl leading-tight font-bold text-ink sm:text-3xl'>
					{title}
				</CardTitle>
				<p className='design-page-description'>{description}</p>
			</CardHeader>
			<CardContent className='grid gap-4 px-0'>{children}</CardContent>
			{footer ? (
				<CardFooter className='justify-center border-t border-border bg-transparent px-0 pt-5 pb-0'>
					{footer}
				</CardFooter>
			) : null}
		</Card>
	);
}

export function AuthDivider({ label }: AuthDividerProps) {
	return (
		<div className='design-divider' data-testid='auth-divider'>
			<span>{label}</span>
		</div>
	);
}

export function AuthEmailField({ error, id, label, placeholder, ...props }: AuthEmailFieldProps) {
	return (
		<label className='grid gap-2' htmlFor={id} data-testid={`${id}-field`} data-invalid={!!error}>
			<span className='design-label'>{label}</span>
			<input
				id={id}
				type='email'
				autoComplete='email'
				placeholder={placeholder}
				className='design-input w-full'
				aria-invalid={!!error}
				aria-describedby={error ? `${id}-error` : undefined}
				data-testid={id}
				{...props}
			/>
			{error ? (
				<span id={`${id}-error`} className='design-field-error px-1' data-testid={`${id}-error`}>
					{error}
				</span>
			) : null}
		</label>
	);
}
