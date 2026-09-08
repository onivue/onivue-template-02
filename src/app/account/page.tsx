import { Suspense } from 'react';

import { AccountSettings } from '@/components/account/account-settings';
import { PasswordSettings } from '@/components/account/password-settings';
import { ProfileSettings } from '@/components/account/profile-settings';
import { Layout } from '@/components/layout/layout';
import { ConnectedClients } from '@/components/mcp/connected-clients';
import { CardSkeleton } from '@/components/ui/skeleton';
import { loadAccountOverview } from '@/lib/account/account-overview';
import { drizzleAccountGateway } from '@/lib/account/drizzle-account-gateway';
import { requireViewer } from '@/lib/auth/viewer';

export const metadata = {
	title: 'Account | onivue',
	description: 'Profil, Passkeys und E-Mail-Adresse verwalten.',
};

// profile and address come straight off the session, so they land as soon as it resolves
async function ViewerPanels() {
	const viewer = await requireViewer();

	return (
		<>
			<ProfileSettings
				currentFirstName={viewer.firstName}
				currentLastName={viewer.lastName}
				currentUsername={viewer.username}
			/>
			<AccountSettings currentEmail={viewer.email} />
		</>
	);
}

// these two wait on the viewer's own records, which is a query more than the panels above
async function AccountRecordPanels() {
	const viewer = await requireViewer();
	const { connections, hasPassword } = await loadAccountOverview(drizzleAccountGateway, viewer.id);

	return (
		<>
			<PasswordSettings currentEmail={viewer.email} hasPassword={hasPassword} />
			<ConnectedClients connections={connections} />
		</>
	);
}

export default function AccountPage() {
	return (
		<Layout>
			<div className='flex flex-col gap-8 py-2' data-testid='account-page'>
				<header className='grid max-w-2xl gap-3'>
					<p className='design-section-label w-fit px-3 py-1.5'>Account</p>
					<div className='grid gap-2'>
						<h1 className='design-page-title text-[clamp(2rem,5vw,3.5rem)]'>Account</h1>
						<p className='design-page-description'>
							Pflege dein Profil, verwalte deine Anmeldemethoden und halte deine E-Mail-Adresse aktuell.
						</p>
					</div>
				</header>

				<Suspense
					fallback={
						<>
							<CardSkeleton className='h-64' />
							<CardSkeleton className='h-64' />
						</>
					}
				>
					<ViewerPanels />
				</Suspense>

				<Suspense
					fallback={
						<>
							<CardSkeleton className='h-56' />
							<CardSkeleton className='h-56' />
						</>
					}
				>
					<AccountRecordPanels />
				</Suspense>
			</div>
		</Layout>
	);
}
