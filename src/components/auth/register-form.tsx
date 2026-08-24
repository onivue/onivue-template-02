'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthEmailField } from '@/components/auth/auth-card';
import { useAccountActions } from '@/lib/auth/use-account-actions';

const registerSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
	const accountActions = useAccountActions();
	const form = useForm<RegisterFormValues>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(registerSchema),
	});

	async function handleRegister(values: RegisterFormValues): Promise<void> {
		await accountActions.register(values.email);
	}

	return (
		<form className='grid gap-4' onSubmit={form.handleSubmit(handleRegister)} data-testid='register-form'>
			<AuthEmailField
				id='register-email'
				label='E-Mail-Adresse'
				placeholder='du@example.com'
				error={form.formState.errors.email?.message}
				disabled={accountActions.isBusy}
				{...form.register('email')}
			/>
			<button
				type='submit'
				className='design-auth-button-dark inline-flex items-center justify-center gap-3 px-5 disabled:opacity-50'
				disabled={accountActions.isBusy}
				data-testid='register-submit-button'
			>
				<Mail data-icon='inline-start' aria-hidden='true' />
				<span>
					{accountActions.isRunning('register') ? 'Link wird gesendet...' : 'Bestätigungslink senden'}
				</span>
			</button>
		</form>
	);
}
