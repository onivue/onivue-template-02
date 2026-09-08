'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthDivider } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { APP_ROUTES } from '@/config/routes';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { signInWithPasswordFormSchema, type SignInWithPasswordFormValues } from '@/lib/profile/profile-schema';

const magicLinkSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export function LoginForm() {
	const searchParams = useSearchParams();
	const { actions, isBusy, isRunning } = useAccountActions();
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
		await actions.signInWithPassword(values.email, values.password);
	}

	async function handleMagicLink(values: MagicLinkFormValues): Promise<void> {
		await actions.sendLoginLink(values.email, searchParams.get('callbackURL'));
	}

	return (
		<>
			<Button
				type='button'
				variant='strong'
				size='xl'
				className='w-full'
				disabled={isBusy}
				onClick={() => void actions.signInWithPasskey()}
				data-testid='login-passkey-button'
			>
				<Fingerprint data-icon='inline-start' aria-hidden='true' />
				<span>{isRunning('sign-in-passkey') ? 'Passkey prüfen...' : 'Mit Passkey anmelden'}</span>
			</Button>

			<AuthDivider label='oder' />

			<form
				className='design-form'
				onSubmit={passwordForm.handleSubmit(handlePasswordSignIn)}
				data-testid='login-password-form'
			>
				<FormField
					id='login-password-email'
					label='E-Mail'
					type='email'
					autoComplete='email'
					placeholder='du@example.com'
					error={passwordForm.formState.errors.email?.message}
					disabled={isBusy}
					{...passwordForm.register('email')}
				/>
				<FormField
					id='login-password'
					label='Passwort'
					type='password'
					autoComplete='current-password'
					error={passwordForm.formState.errors.password?.message}
					disabled={isBusy}
					labelSuffix={
						<Link
							href={APP_ROUTES.FORGOT_PASSWORD}
							className='rounded-sm text-xs font-bold text-ink-soft underline underline-offset-4 outline-none transition-colors hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/50'
							data-testid='login-forgot-password-link'
						>
							Passwort vergessen?
						</Link>
					}
					{...passwordForm.register('password')}
				/>
				<Button
					type='submit'
					variant='strong'
					size='xl'
					className='w-full'
					disabled={isBusy}
					data-testid='login-password-button'
				>
					<KeyRound data-icon='inline-start' aria-hidden='true' />
					<span>{isRunning('sign-in-password') ? 'Melde an...' : 'Anmelden'}</span>
				</Button>
			</form>

			<AuthDivider label='oder' />

			<form
				className='design-form'
				onSubmit={magicLinkForm.handleSubmit(handleMagicLink)}
				data-testid='login-magic-link-form'
			>
				<FormField
					id='login-email'
					label='E-Mail'
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
					data-testid='login-magic-link-button'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>{isRunning('send-login-link') ? 'Link wird gesendet...' : 'Login-Link senden'}</span>
				</Button>
			</form>
		</>
	);
}
