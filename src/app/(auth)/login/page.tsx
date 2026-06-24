import Link from 'next/link';
import { Suspense } from 'react';

import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
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
				<p className='design-auth-description text-center text-xs sm:text-sm' data-testid='login-register-link'>
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
			<Suspense fallback={null}>
				<LoginForm />
			</Suspense>
		</AuthCard>
	);
}
