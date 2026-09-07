'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '@/lib/profile/profile-schema';

export function ResetPasswordForm() {
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const { actions, isBusy, isRunning } = useAccountActions();
	const form = useForm<ResetPasswordFormValues>({
		defaultValues: {
			confirmPassword: '',
			password: '',
		},
		resolver: zodResolver(resetPasswordFormSchema),
	});

	async function handleSubmit(values: ResetPasswordFormValues): Promise<void> {
		if (!token) {
			return;
		}

		await actions.resetPassword(values.password, token);
	}

	if (!token) {
		return (
			<p className='design-field-error px-1' data-testid='reset-password-missing-token'>
				Der Link ist ungültig oder abgelaufen. Fordere einen neuen Link an.
			</p>
		);
	}

	return (
		<form className='grid gap-4' onSubmit={form.handleSubmit(handleSubmit)} data-testid='reset-password-form'>
			<FormField
				id='reset-password'
				label='Neues Passwort'
				type='password'
				autoComplete='new-password'
				error={form.formState.errors.password?.message}
				disabled={isBusy}
				{...form.register('password')}
			/>
			<FormField
				id='reset-confirm-password'
				label='Passwort bestätigen'
				type='password'
				autoComplete='new-password'
				error={form.formState.errors.confirmPassword?.message}
				disabled={isBusy}
				{...form.register('confirmPassword')}
			/>
			<Button
				type='submit'
				variant='strong'
				size='xl'
				className='w-full'
				disabled={isBusy}
				data-testid='reset-password-submit-button'
			>
				<KeyRound data-icon='inline-start' aria-hidden='true' />
				<span>{isRunning('reset-password') ? 'Speichere...' : 'Passwort speichern'}</span>
			</Button>
		</form>
	);
}
