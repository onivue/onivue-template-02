'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthDivider, AuthEmailField } from '@/components/auth/auth-card';
import { useAccountActions } from '@/lib/auth/use-account-actions';

const loginSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
	const searchParams = useSearchParams();
	const accountActions = useAccountActions();
	const form = useForm<LoginFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(loginSchema),
	});

	async function handleMagicLink(values: LoginFormValues): Promise<void> {
		await accountActions.sendLoginLink(values.email, searchParams.get('callbackURL'));
	}

	return (
		<>
			<button
				type='button'
				className='design-auth-button-dark inline-flex items-center justify-center gap-3 px-5 disabled:opacity-50'
				disabled={accountActions.isBusy}
				onClick={() => void accountActions.signInWithPasskey()}
				data-testid='login-passkey-button'
			>
				<Fingerprint data-icon='inline-start' aria-hidden='true' />
				<span>
					{accountActions.isRunning('sign-in-passkey') ? 'Passkey prüfen...' : 'Mit Passkey anmelden'}
				</span>
			</button>
			<AuthDivider label='oder' />
			<form
				className='grid gap-4'
				onSubmit={form.handleSubmit(handleMagicLink)}
				data-testid='login-magic-link-form'
			>
				<AuthEmailField
					id='login-email'
					label='E-Mail'
					placeholder='du@example.com'
					error={form.formState.errors.email?.message}
					disabled={accountActions.isBusy}
					{...form.register('email')}
				/>
				<button
					type='submit'
					className='inline-flex min-h-[3.05rem] items-center justify-center gap-3 rounded-full border border-[oklch(0.82_0.006_106)] bg-[var(--surface-elevated)] px-5 text-[clamp(0.86rem,1.6vw,0.95rem)] font-bold text-[var(--ink)] disabled:opacity-50'
					disabled={accountActions.isBusy}
					data-testid='login-magic-link-button'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>
						{accountActions.isRunning('send-login-link') ? 'Link wird gesendet...' : 'Login-Link senden'}
					</span>
				</button>
			</form>
		</>
	);
}
