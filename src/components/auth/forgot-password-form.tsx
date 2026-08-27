'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from '@/lib/profile/profile-schema';

export function ForgotPasswordForm() {
	const { actions, isBusy, isRunning } = useAccountActions();
	const form = useForm<ForgotPasswordFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(forgotPasswordFormSchema),
	});

	async function handleSubmit(values: ForgotPasswordFormValues): Promise<void> {
		await actions.requestPasswordReset(values.email);
	}

	return (
		<form className='grid gap-4' onSubmit={form.handleSubmit(handleSubmit)} data-testid='forgot-password-form'>
			<FormField
				id='forgot-password-email'
				label='E-Mail-Adresse'
				type='email'
				autoComplete='email'
				placeholder='du@example.com'
				error={form.formState.errors.email?.message}
				disabled={isBusy}
				{...form.register('email')}
			/>
			<Button
				type='submit'
				variant='strong'
				size='xl'
				className='w-full'
				disabled={isBusy}
				data-testid='forgot-password-submit-button'
			>
				<Mail data-icon='inline-start' aria-hidden='true' />
				<span>{isRunning('request-password-reset') ? 'Link wird gesendet...' : 'Link senden'}</span>
			</Button>
		</form>
	);
}
