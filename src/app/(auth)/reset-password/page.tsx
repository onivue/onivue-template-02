import { Suspense } from 'react';

import { AuthCard } from '@/components/auth/auth-card';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = {
	title: 'Passwort zurücksetzen | onivue',
	description: 'Lege ein neues Passwort für dein Konto fest.',
};

export default function ResetPasswordPage() {
	return (
		<AuthCard
			title='Neues Passwort festlegen'
			description='Vergib ein neues Passwort für dein Konto.'
			testId='reset-password-page'
		>
			<Suspense fallback={null}>
				<ResetPasswordForm />
			</Suspense>
		</AuthCard>
	);
}
