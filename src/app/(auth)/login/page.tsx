import { Fingerprint, Mail } from 'lucide-react';
import Link from 'next/link';

import { AuthCard, AuthDivider, AuthEmailField } from '@/components/auth/auth-card';
import { APP_ROUTES } from '@/components/layout/navigation.config';

export const metadata = {
	title: 'Login | onivue',
	description: 'Mit Passkey oder Magic Link anmelden.',
};

export default function LoginPage() {
	return (
		<AuthCard
			title='Willkommen zurück'
			description='Melde dich mit Passkey oder per E-Mail-Link an.'
			testId='login-page'
			footer={
				<p className='design-auth-copy text-center text-xs sm:text-sm' data-testid='login-register-link'>
					Neu hier?{' '}
					<Link
						href={APP_ROUTES.REGISTER}
						className='font-bold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50'
					>
						Registrieren
					</Link>
				</p>
			}
		>
			<button
				type='button'
				className='design-auth-button-dark inline-flex items-center justify-center gap-3 px-5'
			>
				<Fingerprint data-icon='inline-start' aria-hidden='true' />
				<span>Mit Passkey anmelden</span>
			</button>
			<AuthDivider label='oder' />
			<div className='grid gap-4'>
				<AuthEmailField id='login-email' label='E-Mail' placeholder='du@example.com' />
				<button
					type='button'
					className='design-auth-button-outline inline-flex items-center justify-center gap-3 px-5'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>Login-Link senden</span>
				</button>
			</div>
		</AuthCard>
	);
}
