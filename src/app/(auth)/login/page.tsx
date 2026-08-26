import Link from 'next/link';
import { Suspense } from 'react';

import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { APP_ROUTES } from '@/config/routes';

export const metadata = {
	title: 'Login | onivue',
	description: 'Mit Passkey, Passwort oder Magic Link anmelden.',
};

export default function LoginPage() {
	return (
		<AuthCard
			title='Willkommen zurück'
			description='Melde dich mit Passkey, Passwort oder per E-Mail-Link an.'
			testId='login-page'
			footer={
				<p className='text-center text-sm font-medium text-ink-soft' data-testid='login-register-link'>
					Neu hier?{' '}
					<Link
						href={APP_ROUTES.REGISTER}
						className='rounded-sm font-bold text-foreground underline underline-offset-4 outline-none transition-colors hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/50'
					>
						Registrieren
					</Link>
				</p>
			}
		>
			<Suspense fallback={null}>
				<LoginForm />
			</Suspense>
		</AuthCard>
	);
}
