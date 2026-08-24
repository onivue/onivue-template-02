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
				<AccountSettings currentEmail={viewer.email} />
			</div>
		</Layout>
	);
}
