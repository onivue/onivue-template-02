'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '@/lib/profile/profile-schema';

export function ResetPasswordForm() {
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const accountActions = useAccountActions();
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

		await accountActions.resetPassword(values.password, token);
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
			<label className='grid gap-2' htmlFor='reset-password' data-invalid={!!form.formState.errors.password}>
				<span className='design-label'>Neues Passwort</span>
				<input
					id='reset-password'
					type='password'
					autoComplete='new-password'
					className='design-input w-full'
					aria-invalid={!!form.formState.errors.password}
					aria-describedby={form.formState.errors.password ? 'reset-password-error' : undefined}
					disabled={accountActions.isBusy}
					data-testid='reset-password-input'
					{...form.register('password')}
				/>
				{form.formState.errors.password?.message ? (
					<span
						id='reset-password-error'
						className='design-field-error px-1'
						data-testid='reset-password-error'
					>
						{form.formState.errors.password.message}
					</span>
				) : null}
			</label>
			<label
				className='grid gap-2'
				htmlFor='reset-confirm-password'
				data-invalid={!!form.formState.errors.confirmPassword}
			>
				<span className='design-label'>Passwort bestätigen</span>
				<input
					id='reset-confirm-password'
					type='password'
					autoComplete='new-password'
					className='design-input w-full'
					aria-invalid={!!form.formState.errors.confirmPassword}
					aria-describedby={
						form.formState.errors.confirmPassword ? 'reset-confirm-password-error' : undefined
					}
					disabled={accountActions.isBusy}
					data-testid='reset-confirm-password-input'
					{...form.register('confirmPassword')}
				/>
				{form.formState.errors.confirmPassword?.message ? (
					<span
						id='reset-confirm-password-error'
						className='design-field-error px-1'
						data-testid='reset-confirm-password-error'
					>
						{form.formState.errors.confirmPassword.message}
					</span>
				) : null}
			</label>
			<Button
				type='submit'
				variant='strong'
				size='xl'
				className='w-full'
				disabled={accountActions.isBusy}
				data-testid='reset-password-submit-button'
			>
				<KeyRound data-icon='inline-start' aria-hidden='true' />
				<span>{accountActions.isRunning('reset-password') ? 'Speichere...' : 'Passwort speichern'}</span>
			</Button>
		</form>
	);
}
