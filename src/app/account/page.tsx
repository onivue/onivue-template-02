import { AccountSettings } from '@/components/account/account-settings';
import { Layout } from '@/components/layout/layout';
import { requireViewer } from '@/lib/auth/viewer';

export const metadata = {
	title: 'Account | onivue',
	description: 'Passkeys und E-Mail-Adresse verwalten.',
};

export default async function AccountPage() {
	const viewer = await requireViewer();

	return (
		<Layout>
			<div className='flex flex-col gap-6 py-2' data-testid='account-page'>
				<header className='grid max-w-2xl gap-3'>
					<p className='design-section-label w-fit px-3 py-1.5'>Account</p>
					<div className='grid gap-2'>
						<h1 className='design-page-title text-[clamp(2rem,5vw,3.5rem)]'>Account</h1>
						<p className='design-page-description'>
							Verwalte deine Anmeldemethoden und halte deine E-Mail-Adresse aktuell.
						</p>
					</div>
				</header>
				<AccountSettings currentEmail={viewer.email} />
			</div>
		</Layout>
	);
}
