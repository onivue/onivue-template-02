'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthDivider, AuthEmailField } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { signUpWithPasswordFormSchema, type SignUpWithPasswordFormValues } from '@/lib/profile/profile-schema';

const magicLinkSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export function RegisterForm() {
	const accountActions = useAccountActions();
	const passwordForm = useForm<SignUpWithPasswordFormValues>({
		defaultValues: {
			confirmPassword: '',
			email: '',
			password: '',
		},
		resolver: zodResolver(signUpWithPasswordFormSchema),
	});
	const magicLinkForm = useForm<MagicLinkFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(magicLinkSchema),
	});

	async function handlePasswordSignUp(values: SignUpWithPasswordFormValues): Promise<void> {
		const outcome = await accountActions.signUpWithPassword(values.email, values.password);

		if (outcome.ok) {
			passwordForm.reset({ confirmPassword: '', email: '', password: '' });
		}
	}

	async function handleMagicLinkRegister(values: MagicLinkFormValues): Promise<void> {
		await accountActions.register(values.email);
	}

	return (
		<>
			<form
				className='grid gap-4'
				onSubmit={passwordForm.handleSubmit(handlePasswordSignUp)}
				data-testid='register-password-form'
			>
				<AuthEmailField
					id='register-password-email'
					label='E-Mail-Adresse'
					placeholder='du@example.com'
					error={passwordForm.formState.errors.email?.message}
					disabled={accountActions.isBusy}
					{...passwordForm.register('email')}
				/>
				<label
					className='grid gap-2'
					htmlFor='register-password'
					data-invalid={!!passwordForm.formState.errors.password}
				>
					<span className='design-label'>Passwort</span>
					<input
						id='register-password'
						type='password'
						autoComplete='new-password'
						className='design-input w-full'
						aria-invalid={!!passwordForm.formState.errors.password}
						aria-describedby={
							passwordForm.formState.errors.password ? 'register-password-error' : undefined
						}
						disabled={accountActions.isBusy}
						data-testid='register-password-input'
						{...passwordForm.register('password')}
					/>
					{passwordForm.formState.errors.password?.message ? (
						<span
							id='register-password-error'
							className='design-field-error px-1'
							data-testid='register-password-error'
						>
							{passwordForm.formState.errors.password.message}
						</span>
					) : null}
				</label>
				<label
					className='grid gap-2'
					htmlFor='register-confirm-password'
					data-invalid={!!passwordForm.formState.errors.confirmPassword}
				>
					<span className='design-label'>Passwort bestätigen</span>
					<input
						id='register-confirm-password'
						type='password'
						autoComplete='new-password'
						className='design-input w-full'
						aria-invalid={!!passwordForm.formState.errors.confirmPassword}
						aria-describedby={
							passwordForm.formState.errors.confirmPassword
								? 'register-confirm-password-error'
								: undefined
						}
						disabled={accountActions.isBusy}
						data-testid='register-confirm-password-input'
						{...passwordForm.register('confirmPassword')}
					/>
					{passwordForm.formState.errors.confirmPassword?.message ? (
						<span
							id='register-confirm-password-error'
							className='design-field-error px-1'
							data-testid='register-confirm-password-error'
						>
							{passwordForm.formState.errors.confirmPassword.message}
						</span>
					) : null}
				</label>
				<Button
					type='submit'
					variant='strong'
					size='xl'
					className='w-full'
					disabled={accountActions.isBusy}
					data-testid='register-password-button'
				>
					<UserPlus data-icon='inline-start' aria-hidden='true' />
					<span>
						{accountActions.isRunning('sign-up-password') ? 'Konto wird erstellt...' : 'Konto erstellen'}
					</span>
				</Button>
			</form>

			<AuthDivider label='oder' />

			<form
				className='grid gap-4'
				onSubmit={magicLinkForm.handleSubmit(handleMagicLinkRegister)}
				data-testid='register-form'
			>
				<AuthEmailField
					id='register-email'
					label='E-Mail-Adresse'
					placeholder='du@example.com'
					error={magicLinkForm.formState.errors.email?.message}
					disabled={accountActions.isBusy}
					{...magicLinkForm.register('email')}
				/>
				<Button
					type='submit'
					variant='outline'
					size='xl'
					className='w-full'
					disabled={accountActions.isBusy}
					data-testid='register-submit-button'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>
						{accountActions.isRunning('register') ? 'Link wird gesendet...' : 'Bestätigungslink senden'}
					</span>
				</Button>
			</form>
		</>
	);
}
