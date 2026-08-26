'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { changePasswordFormSchema, type ChangePasswordFormValues } from '@/lib/profile/profile-schema';

const RESET_DEFAULT_VALUES: ChangePasswordFormValues = {
	confirmNewPassword: '',
	currentPassword: '',
	newPassword: '',
};

type PasswordSettingsProps = {
	currentEmail: string;
	hasPassword: boolean;
};

export function PasswordSettings({ currentEmail, hasPassword }: PasswordSettingsProps) {
	const accountActions = useAccountActions();
	const isBusy = accountActions.isBusy;
	const form = useForm<ChangePasswordFormValues>({
		defaultValues: RESET_DEFAULT_VALUES,
		resolver: zodResolver(changePasswordFormSchema),
	});

	async function handleChangePassword(values: ChangePasswordFormValues): Promise<void> {
		const outcome = await accountActions.changePassword(values.currentPassword, values.newPassword);

		if (outcome.ok) {
			form.reset(RESET_DEFAULT_VALUES);
		}
	}

	async function handleRequestReset(): Promise<void> {
		await accountActions.requestPasswordReset(currentEmail);
	}

	return (
		<section
			className='design-panel grid content-start gap-5 p-5 sm:p-6 lg:max-w-2xl'
			data-testid='password-settings'
		>
			<div className='grid gap-2'>
				<p className='design-section-label w-fit px-3 py-1.5'>Passwort</p>
				<h2 className='text-xl font-bold text-foreground'>
					{hasPassword ? 'Passwort ändern' : 'Passwort festlegen'}
				</h2>
				<p className='design-page-description max-w-2xl'>
					{hasPassword
						? 'Vergib ein neues Passwort für die Anmeldung mit E-Mail und Passwort.'
						: 'Für dieses Konto ist noch kein Passwort hinterlegt. Fordere einen Link an, um eines festzulegen.'}
				</p>
			</div>

			{hasPassword ? (
				<form className='grid gap-4' onSubmit={form.handleSubmit(handleChangePassword)}>
					<label
						className='grid gap-2'
						htmlFor='current-password'
						data-invalid={!!form.formState.errors.currentPassword}
					>
						<span className='design-label'>Aktuelles Passwort</span>
						<input
							id='current-password'
							type='password'
							autoComplete='current-password'
							className='design-input w-full'
							aria-invalid={!!form.formState.errors.currentPassword}
							aria-describedby={
								form.formState.errors.currentPassword ? 'current-password-error' : undefined
							}
							disabled={isBusy}
							data-testid='current-password-input'
							{...form.register('currentPassword')}
						/>
						{form.formState.errors.currentPassword?.message ? (
							<span
								id='current-password-error'
								className='design-field-error px-1'
								data-testid='current-password-error'
							>
								{form.formState.errors.currentPassword.message}
							</span>
						) : null}
					</label>

					<label
						className='grid gap-2'
						htmlFor='new-password'
						data-invalid={!!form.formState.errors.newPassword}
					>
						<span className='design-label'>Neues Passwort</span>
						<input
							id='new-password'
							type='password'
							autoComplete='new-password'
							className='design-input w-full'
							aria-invalid={!!form.formState.errors.newPassword}
							aria-describedby={form.formState.errors.newPassword ? 'new-password-error' : undefined}
							disabled={isBusy}
							data-testid='new-password-input'
							{...form.register('newPassword')}
						/>
						{form.formState.errors.newPassword?.message ? (
							<span
								id='new-password-error'
								className='design-field-error px-1'
								data-testid='new-password-error'
							>
								{form.formState.errors.newPassword.message}
							</span>
						) : null}
					</label>

					<label
						className='grid gap-2'
						htmlFor='confirm-new-password'
						data-invalid={!!form.formState.errors.confirmNewPassword}
					>
						<span className='design-label'>Neues Passwort bestätigen</span>
						<input
							id='confirm-new-password'
							type='password'
							autoComplete='new-password'
							className='design-input w-full'
							aria-invalid={!!form.formState.errors.confirmNewPassword}
							aria-describedby={
								form.formState.errors.confirmNewPassword ? 'confirm-new-password-error' : undefined
							}
							disabled={isBusy}
							data-testid='confirm-new-password-input'
							{...form.register('confirmNewPassword')}
						/>
						{form.formState.errors.confirmNewPassword?.message ? (
							<span
								id='confirm-new-password-error'
								className='design-field-error px-1'
								data-testid='confirm-new-password-error'
							>
								{form.formState.errors.confirmNewPassword.message}
							</span>
						) : null}
					</label>

					<Button
						type='submit'
						variant='strong'
						size='xl'
						disabled={isBusy}
						data-testid='change-password-button'
					>
						<KeyRound data-icon='inline-start' aria-hidden='true' />
						{accountActions.isRunning('change-password') ? 'Speichere...' : 'Passwort ändern'}
					</Button>
				</form>
			) : (
				<Button
					type='button'
					variant='strong'
					size='xl'
					disabled={isBusy}
					onClick={() => void handleRequestReset()}
					data-testid='request-set-password-button'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					{accountActions.isRunning('request-password-reset') ? 'Sende...' : 'Passwort per E-Mail festlegen'}
				</Button>
			)}
		</section>
	);
}
