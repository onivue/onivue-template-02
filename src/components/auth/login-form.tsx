'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AuthDivider, AuthEmailField } from '@/components/auth/auth-card';
import { APP_ROUTES } from '@/components/layout/navigation.config';
import { authClient } from '@/lib/auth/auth-client';
import { authErrorHelper } from '@/lib/auth/auth-error-helper';

const loginSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormState = { status: 'idle' } | { status: 'sending-link' } | { status: 'signing-passkey' };

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const form = useForm<LoginFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(loginSchema),
	});
	const [formState, setFormState] = useState<LoginFormState>({ status: 'idle' });
	const isBusy = formState.status !== 'idle';

	async function handleMagicLink(values: LoginFormValues): Promise<void> {
		setFormState({ status: 'sending-link' });
		const callbackURL = getSafeCallbackUrl(searchParams.get('callbackURL'));

		try {
			const { error } = await authClient.signIn.magicLink({
				callbackURL,
				email: values.email,
				errorCallbackURL: APP_ROUTES.LOGIN,
				newUserCallbackURL: APP_ROUTES.ACCOUNT,
			});

			if (error) {
				toast.error(
					authErrorHelper.getUserMessage(
						error,
						'Der Login-Link konnte nicht gesendet werden. Bitte versuche es erneut.'
					)
				);
				return;
			}

			toast.success('Login-Link gesendet. Bitte öffne deine E-Mail und bestätige den Link.');
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Der Login-Link konnte nicht gesendet werden. Bitte versuche es erneut.'
				)
			);
		} finally {
			setFormState({ status: 'idle' });
		}
	}

	async function handlePasskeyLogin(): Promise<void> {
		setFormState({ status: 'signing-passkey' });

		try {
			const { error } = await authClient.signIn.passkey();

			if (error) {
				toast.error(authErrorHelper.getUserMessage(error, 'Die Passkey-Anmeldung ist fehlgeschlagen.'));
				return;
			}

			toast.success('Erfolgreich angemeldet.');
			router.push(APP_ROUTES.ACCOUNT);
			router.refresh();
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Die Passkey-Anmeldung ist fehlgeschlagen.'
				)
			);
		} finally {
			setFormState({ status: 'idle' });
		}
	}

	return (
		<>
			<button
				type='button'
				className='design-auth-button-dark inline-flex items-center justify-center gap-3 px-5 disabled:opacity-50'
				disabled={isBusy}
				onClick={handlePasskeyLogin}
				data-testid='login-passkey-button'
			>
				<Fingerprint data-icon='inline-start' aria-hidden='true' />
				<span>{formState.status === 'signing-passkey' ? 'Passkey prüfen...' : 'Mit Passkey anmelden'}</span>
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
					disabled={isBusy}
					{...form.register('email')}
				/>
				<button
					type='submit'
					className='inline-flex min-h-[3.05rem] items-center justify-center gap-3 rounded-full border border-[oklch(0.82_0.006_106)] bg-[var(--surface-elevated)] px-5 text-[clamp(0.86rem,1.6vw,0.95rem)] font-bold text-[var(--ink)] disabled:opacity-50'
					disabled={isBusy}
					data-testid='login-magic-link-button'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>{formState.status === 'sending-link' ? 'Link wird gesendet...' : 'Login-Link senden'}</span>
				</button>
			</form>
		</>
	);
}

function getSafeCallbackUrl(callbackURL: string | null): string {
	if (!callbackURL?.startsWith('/') || callbackURL.startsWith('//')) {
		return APP_ROUTES.ACCOUNT;
	}

	if (callbackURL === APP_ROUTES.LOGIN || callbackURL === APP_ROUTES.REGISTER) {
		return APP_ROUTES.ACCOUNT;
	}

	return callbackURL;
}
