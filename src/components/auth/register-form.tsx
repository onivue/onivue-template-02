'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AuthEmailField } from '@/components/auth/auth-card';
import { APP_ROUTES } from '@/components/layout/navigation.config';
import { authClient } from '@/lib/auth/auth-client';
import { authErrorHelper } from '@/lib/auth/auth-error-helper';
import { authIdentityHelper } from '@/lib/auth/auth-identity-helper';

const registerSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterFormState = { status: 'idle' } | { status: 'sending-link' };

export function RegisterForm() {
	const form = useForm<RegisterFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(registerSchema),
	});
	const [formState, setFormState] = useState<RegisterFormState>({ status: 'idle' });
	const isBusy = formState.status !== 'idle';

	async function handleRegister(values: RegisterFormValues): Promise<void> {
		setFormState({ status: 'sending-link' });

		try {
			const { error } = await authClient.signIn.magicLink({
				callbackURL: APP_ROUTES.ACCOUNT,
				email: values.email,
				errorCallbackURL: APP_ROUTES.REGISTER,
				name: authIdentityHelper.getDefaultName(values.email),
				newUserCallbackURL: APP_ROUTES.ACCOUNT,
			});

			if (error) {
				toast.error(
					authErrorHelper.getUserMessage(
						error,
						'Der Registrierungslink konnte nicht gesendet werden. Bitte versuche es erneut.'
					)
				);
				return;
			}

			toast.success('Registrierungslink gesendet. Bitte öffne deine E-Mail und bestätige den Link.');
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Der Registrierungslink konnte nicht gesendet werden. Bitte versuche es erneut.'
				)
			);
		} finally {
			setFormState({ status: 'idle' });
		}
	}

	return (
		<form className='grid gap-4' onSubmit={form.handleSubmit(handleRegister)} data-testid='register-form'>
			<AuthEmailField
				id='register-email'
				label='E-Mail-Adresse'
				placeholder='du@example.com'
				error={form.formState.errors.email?.message}
				disabled={isBusy}
				{...form.register('email')}
			/>
			<button
				type='submit'
				className='design-auth-button-dark inline-flex items-center justify-center gap-3 px-5 disabled:opacity-50'
				disabled={isBusy}
				data-testid='register-submit-button'
			>
				<Mail data-icon='inline-start' aria-hidden='true' />
				<span>{formState.status === 'sending-link' ? 'Link wird gesendet...' : 'Bestätigungslink senden'}</span>
			</button>
		</form>
	);
}
