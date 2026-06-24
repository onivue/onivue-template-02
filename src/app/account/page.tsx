import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AccountSettings } from '@/components/account/account-settings';
import { Layout } from '@/components/layout/layout';
import { APP_ROUTES } from '@/components/layout/navigation.config';
import { auth } from '@/lib/auth/auth';

export const metadata = {
	title: 'Account | onivue',
	description: 'Passkeys und E-Mail-Adresse verwalten.',
};

export default async function AccountPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect(APP_ROUTES.LOGIN);
	}

	return (
		<Layout>
			<div className='flex min-h-full flex-col gap-6' data-testid='account-page'>
				<header className='grid gap-3'>
					<p className='design-section-label w-fit px-3 py-1'>Account</p>
					<div className='grid gap-2'>
						<h1 className='design-page-title text-[clamp(2rem,5vw,3.8rem)]'>Account</h1>
						<p className='design-page-description max-w-2xl'>
							Verwalte deine Anmeldemethoden und halte deine E-Mail-Adresse aktuell.
						</p>
					</div>
				</header>
				<AccountSettings currentEmail={session.user.email} />
			</div>
		</Layout>
	);
}
