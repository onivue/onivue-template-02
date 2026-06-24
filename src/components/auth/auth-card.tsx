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
				'w-full max-w-[32rem] gap-4 border border-border bg-[var(--surface-elevated)] px-5 pt-5 pb-7 shadow-[0_16px_36px_oklch(0.16_0.012_260_/_7%),0_2px_0_oklch(0.16_0.012_260_/_4%)] [border-radius:clamp(1.5rem,4vw,2.25rem)] sm:gap-5 sm:px-7 sm:pt-7 sm:pb-9',
				className
			)}
			data-testid={testId}
		>
			<CardHeader className='gap-2 px-0'>
				<CardTitle className='font-heading text-[clamp(1.5rem,4vw,2rem)] leading-[1.08] font-bold tracking-normal text-[var(--ink)]'>
					{title}
				</CardTitle>
				<p className='design-auth-description'>{description}</p>
			</CardHeader>
			<CardContent className='grid gap-5 px-0'>{children}</CardContent>
			{footer ? (
				<CardFooter className='justify-center border-0 bg-transparent px-0 pt-2 pb-3 sm:pt-3 sm:pb-4'>
					{footer}
				</CardFooter>
			) : null}
		</Card>
	);
}

export function AuthDivider({ label }: AuthDividerProps) {
	return (
		<div
			className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-[0.62rem] font-bold tracking-[0.2em] text-[oklch(0.72_0.01_260)] uppercase before:h-px before:bg-[oklch(0.88_0.006_106)] before:content-[''] after:h-px after:bg-[oklch(0.88_0.006_106)] after:content-['']"
			data-testid='auth-divider'
		>
			<span>{label}</span>
		</div>
	);
}

export function AuthEmailField({ error, id, label, placeholder, ...props }: AuthEmailFieldProps) {
	return (
		<label className='grid gap-2' htmlFor={id} data-testid={`${id}-field`} data-invalid={!!error}>
			<span className='design-auth-label'>{label}</span>
			<input
				id={id}
				type='email'
				autoComplete='email'
				placeholder={placeholder}
				className='design-auth-input w-full'
				aria-invalid={!!error}
				data-testid={id}
				{...props}
			/>
			{error ? (
				<span className='text-xs font-semibold text-destructive' data-testid={`${id}-error`}>
					{error}
				</span>
			) : null}
		</label>
	);
}
