'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthDivider } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { signUpWithPasswordFormSchema, type SignUpWithPasswordFormValues } from '@/lib/profile/profile-schema';

const magicLinkSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export function RegisterForm() {
	const { actions, isBusy, isRunning } = useAccountActions();
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
		const outcome = await actions.signUpWithPassword(values.email, values.password);

		if (outcome.ok) {
			passwordForm.reset({ confirmPassword: '', email: '', password: '' });
		}
	}

	async function handleMagicLinkRegister(values: MagicLinkFormValues): Promise<void> {
		await actions.register(values.email);
	}

	return (
		<>
			<form
				className='design-form'
				onSubmit={passwordForm.handleSubmit(handlePasswordSignUp)}
				data-testid='register-password-form'
			>
				<FormField
					id='register-password-email'
					label='E-Mail-Adresse'
					type='email'
					autoComplete='email'
					placeholder='du@example.com'
					error={passwordForm.formState.errors.email?.message}
					disabled={isBusy}
					{...passwordForm.register('email')}
				/>
				<FormField
					id='register-password'
					label='Passwort'
					type='password'
					autoComplete='new-password'
					error={passwordForm.formState.errors.password?.message}
					disabled={isBusy}
					{...passwordForm.register('password')}
				/>
				<FormField
					id='register-confirm-password'
					label='Passwort bestätigen'
					type='password'
					autoComplete='new-password'
					error={passwordForm.formState.errors.confirmPassword?.message}
					disabled={isBusy}
					{...passwordForm.register('confirmPassword')}
				/>
				<Button
					type='submit'
					variant='strong'
					size='xl'
					className='w-full'
					disabled={isBusy}
					data-testid='register-password-button'
				>
					<UserPlus data-icon='inline-start' aria-hidden='true' />
					<span>{isRunning('sign-up-password') ? 'Konto wird erstellt...' : 'Konto erstellen'}</span>
				</Button>
			</form>

			<AuthDivider label='oder' />

			<form
				className='design-form'
				onSubmit={magicLinkForm.handleSubmit(handleMagicLinkRegister)}
				data-testid='register-form'
			>
				<FormField
					id='register-email'
					label='E-Mail-Adresse'
					type='email'
					autoComplete='email'
					placeholder='du@example.com'
					error={magicLinkForm.formState.errors.email?.message}
					disabled={isBusy}
					{...magicLinkForm.register('email')}
				/>
				<Button
					type='submit'
					variant='outline'
					size='xl'
					className='w-full'
					disabled={isBusy}
					data-testid='register-submit-button'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>{isRunning('register') ? 'Link wird gesendet...' : 'Bestätigungslink senden'}</span>
				</Button>
			</form>
		</>
	);
}
