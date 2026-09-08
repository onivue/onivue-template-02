import Link from 'next/link';

import { AuthCard } from '@/components/auth/auth-card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { APP_ROUTES } from '@/config/routes';

export const metadata = {
	title: 'Passwort vergessen',
	description: 'Fordere einen Link zum Zurücksetzen deines Passworts an.',
};

export default function ForgotPasswordPage() {
	return (
		<AuthCard
			title='Passwort vergessen?'
			description='Wir senden dir einen Link, mit dem du ein neues Passwort festlegen kannst.'
			testId='forgot-password-page'
			footer={
				<p className='text-center text-sm font-medium text-ink-soft' data-testid='forgot-password-login-link'>
					Doch wieder eingefallen?{' '}
					<Link
						href={APP_ROUTES.LOGIN}
						className='rounded-sm font-bold text-foreground underline underline-offset-4 outline-none transition-colors hover:text-accent-strong focus-visible:ring-3 focus-visible:ring-ring/50'
					>
						Anmelden
					</Link>
				</p>
			}
		>
			<ForgotPasswordForm />
		</AuthCard>
	);
}
