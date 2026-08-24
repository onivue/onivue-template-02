'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthDivider, AuthEmailField } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
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
