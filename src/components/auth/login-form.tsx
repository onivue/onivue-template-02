'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthDivider, AuthEmailField } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { signInWithPasswordFormSchema, type SignInWithPasswordFormValues } from '@/lib/profile/profile-schema';

const magicLinkSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export function LoginForm() {
	const searchParams = useSearchParams();
	const accountActions = useAccountActions();
	const passwordForm = useForm<SignInWithPasswordFormValues>({
		defaultValues: {
			email: '',
			password: '',
		},
		resolver: zodResolver(signInWithPasswordFormSchema),
	});
	const magicLinkForm = useForm<MagicLinkFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(magicLinkSchema),
	});

	async function handlePasswordSignIn(values: SignInWithPasswordFormValues): Promise<void> {
		await accountActions.signInWithPassword(values.email, values.password);
	}

	async function handleMagicLink(values: MagicLinkFormValues): Promise<void> {
		await accountActions.sendLoginLink(values.email, searchParams.get('callbackURL'));
	}

	return (
		<>
			<Button
				type='button'
				variant='strong'
				size='xl'
				className='w-full'
				disabled={accountActions.isBusy}
				onClick={() => void accountActions.signInWithPasskey()}
				data-testid='login-passkey-button'
			>
				<Fingerprint data-icon='inline-start' aria-hidden='true' />
				<span>
					{accountActions.isRunning('sign-in-passkey') ? 'Passkey prüfen...' : 'Mit Passkey anmelden'}
				</span>
			</Button>

			<AuthDivider label='oder' />

			<form
				className='grid gap-4'
				onSubmit={passwordForm.handleSubmit(handlePasswordSignIn)}
				data-testid='login-password-form'
			>
				<AuthEmailField
					id='login-password-email'
					label='E-Mail'
					placeholder='du@example.com'
					error={passwordForm.formState.errors.email?.message}
					disabled={accountActions.isBusy}
					{...passwordForm.register('email')}
				/>
				<label
					className='grid gap-2'
					htmlFor='login-password'
					data-invalid={!!passwordForm.formState.errors.password}
				>
					<div className='flex items-center justify-between gap-2'>
						<span className='design-label'>Passwort</span>
						<Link
							href={APP_ROUTES.FORGOT_PASSWORD}
							className='rounded-sm text-xs font-bold text-ink-soft underline underline-offset-4 outline-none transition-colors hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/50'
							data-testid='login-forgot-password-link'
						>
							Passwort vergessen?
						</Link>
					</div>
					<input
						id='login-password'
						type='password'
						autoComplete='current-password'
						className='design-input w-full'
						aria-invalid={!!passwordForm.formState.errors.password}
						aria-describedby={passwordForm.formState.errors.password ? 'login-password-error' : undefined}
						disabled={accountActions.isBusy}
						data-testid='login-password-input'
						{...passwordForm.register('password')}
					/>
					{passwordForm.formState.errors.password?.message ? (
						<span
							id='login-password-error'
							className='design-field-error px-1'
							data-testid='login-password-error'
						>
							{passwordForm.formState.errors.password.message}
						</span>
					) : null}
				</label>
				<Button
					type='submit'
					variant='strong'
					size='xl'
					className='w-full'
					disabled={accountActions.isBusy}
					data-testid='login-password-button'
				>
					<KeyRound data-icon='inline-start' aria-hidden='true' />
					<span>{accountActions.isRunning('sign-in-password') ? 'Melde an...' : 'Anmelden'}</span>
				</Button>
			</form>

			<AuthDivider label='oder' />

			<form
				className='grid gap-4'
				onSubmit={magicLinkForm.handleSubmit(handleMagicLink)}
				data-testid='login-magic-link-form'
			>
				<AuthEmailField
					id='login-email'
					label='E-Mail'
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
					data-testid='login-magic-link-button'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>
						{accountActions.isRunning('send-login-link') ? 'Link wird gesendet...' : 'Login-Link senden'}
					</span>
				</Button>
			</form>
		</>
	);
}
