'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
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
	const { actions, isBusy, isRunning } = useAccountActions();
	const form = useForm<ChangePasswordFormValues>({
		defaultValues: RESET_DEFAULT_VALUES,
		resolver: zodResolver(changePasswordFormSchema),
	});

	async function handleChangePassword(values: ChangePasswordFormValues): Promise<void> {
		const outcome = await actions.changePassword(values.currentPassword, values.newPassword);

		if (outcome.ok) {
			form.reset(RESET_DEFAULT_VALUES);
		}
	}

	async function handleRequestReset(): Promise<void> {
		await actions.requestPasswordReset(currentEmail);
	}

	return (
		<section className='design-panel grid content-start gap-5 p-5 sm:p-6' data-testid='password-settings'>
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
				<form className='design-form' onSubmit={form.handleSubmit(handleChangePassword)}>
					<FormField
						id='current-password'
						label='Aktuelles Passwort'
						type='password'
						autoComplete='current-password'
						error={form.formState.errors.currentPassword?.message}
						disabled={isBusy}
						{...form.register('currentPassword')}
					/>
					<FormField
						id='new-password'
						label='Neues Passwort'
						type='password'
						autoComplete='new-password'
						error={form.formState.errors.newPassword?.message}
						disabled={isBusy}
						{...form.register('newPassword')}
					/>
					<FormField
						id='confirm-new-password'
						label='Neues Passwort bestätigen'
						type='password'
						autoComplete='new-password'
						error={form.formState.errors.confirmNewPassword?.message}
						disabled={isBusy}
						{...form.register('confirmNewPassword')}
					/>
					<Button
						type='submit'
						variant='strong'
						size='xl'
						disabled={isBusy}
						data-testid='change-password-button'
					>
						<KeyRound data-icon='inline-start' aria-hidden='true' />
						{isRunning('change-password') ? 'Speichere...' : 'Passwort ändern'}
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
					{isRunning('request-password-reset') ? 'Sende...' : 'Passwort per E-Mail festlegen'}
				</Button>
			)}
		</section>
	);
}
