import { type ReactNode } from 'react';

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
	id: string;
	label: string;
	placeholder: string;
};

export function AuthCard({ children, className, description, footer, testId, title }: AuthCardProps) {
	return (
		<Card
			className={cn(
				'design-auth-card w-full max-w-[32rem] gap-4 px-5 pt-5 pb-7 sm:gap-5 sm:px-7 sm:pt-7 sm:pb-9',
				className
			)}
			data-testid={testId}
		>
			<CardHeader className='gap-2 px-0'>
				<CardTitle className='design-auth-title'>{title}</CardTitle>
				<p className='design-auth-copy'>{description}</p>
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
		<div className='design-auth-divider' data-testid='auth-divider'>
			<span>{label}</span>
		</div>
	);
}

export function AuthEmailField({ id, label, placeholder }: AuthEmailFieldProps) {
	return (
		<label className='grid gap-2' htmlFor={id} data-testid={`${id}-field`}>
			<span className='design-auth-label'>{label}</span>
			<input
				id={id}
				name='email'
				type='email'
				autoComplete='email'
				placeholder={placeholder}
				className='design-auth-input w-full'
				data-testid={id}
			/>
		</label>
	);
}
