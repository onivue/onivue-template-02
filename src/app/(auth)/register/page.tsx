import Link from 'next/link';

import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import { APP_ROUTES } from '@/config/routes';

export const metadata = {
	title: 'Registrieren | onivue',
	description: 'Konto per E-Mail-Link erstellen.',
};

export default function RegisterPage() {
	return (
		<AuthCard
			title='Konto erstellen'
			description='Nur E-Mail - kein Passwort nötig.'
			testId='register-page'
			footer={
				<div className='grid gap-3 text-center'>
					<p className='text-sm font-medium text-ink-soft'>
						Nach Bestätigung kannst du einen Passkey einrichten (optional).
					</p>
					<p className='text-sm font-medium text-ink-soft' data-testid='register-login-link'>
						Schon Kunde?{' '}
						<Link
							href={APP_ROUTES.LOGIN}
							className='rounded-sm font-bold text-foreground underline underline-offset-4 outline-none transition-colors hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/50'
						>
							Anmelden
						</Link>
					</p>
				</div>
			}
		>
			<RegisterForm />
		</AuthCard>
	);
}
