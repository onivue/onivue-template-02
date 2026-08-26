'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AuthEmailField } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from '@/lib/profile/profile-schema';

export function ForgotPasswordForm() {
	const accountActions = useAccountActions();
	const form = useForm<ForgotPasswordFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(forgotPasswordFormSchema),
	});

	async function handleSubmit(values: ForgotPasswordFormValues): Promise<void> {
		await accountActions.requestPasswordReset(values.email);
	}

	return (
		<form className='grid gap-4' onSubmit={form.handleSubmit(handleSubmit)} data-testid='forgot-password-form'>
			<AuthEmailField
				id='forgot-password-email'
				label='E-Mail-Adresse'
				placeholder='du@example.com'
				error={form.formState.errors.email?.message}
				disabled={accountActions.isBusy}
				{...form.register('email')}
			/>
			<Button
				type='submit'
				variant='strong'
				size='xl'
				className='w-full'
				disabled={accountActions.isBusy}
				data-testid='forgot-password-submit-button'
			>
				<Mail data-icon='inline-start' aria-hidden='true' />
				<span>
					{accountActions.isRunning('request-password-reset') ? 'Link wird gesendet...' : 'Link senden'}
				</span>
			</Button>
		</form>
	);
}
