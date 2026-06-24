import { Mail } from 'lucide-react';
import Link from 'next/link';

import { AuthCard, AuthEmailField } from '@/components/auth/auth-card';
import { APP_ROUTES } from '@/components/layout/navigation.config';

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
				<div className='grid gap-5 text-center'>
					<p className='design-auth-copy max-w-xl text-xs sm:text-sm'>
						Nach Bestätigung kannst du einen Passkey einrichten (optional).
					</p>
					<p className='design-auth-copy text-xs sm:text-sm' data-testid='register-login-link'>
						Schon Kunde?{' '}
						<Link
							href={APP_ROUTES.LOGIN}
							className='font-bold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50'
						>
							Anmelden
						</Link>
					</p>
				</div>
			}
		>
			<div className='grid gap-4'>
				<AuthEmailField id='register-email' label='E-Mail-Adresse' placeholder='du@example.com' />
				<button
					type='button'
					className='design-auth-button-dark inline-flex items-center justify-center gap-3 px-5'
				>
					<Mail data-icon='inline-start' aria-hidden='true' />
					<span>Bestätigungslink senden</span>
				</button>
			</div>
		</AuthCard>
	);
}
