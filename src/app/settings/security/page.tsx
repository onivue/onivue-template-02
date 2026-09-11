import { Suspense } from 'react';

import { AccountSettings } from '@/components/account/account-settings';
import { PasswordSettings } from '@/components/account/password-settings';
import { SettingsHeader } from '@/components/account/settings-header';
import { Layout } from '@/components/layout/layout';
import { ConnectedClients } from '@/components/mcp/connected-clients';
import { CardSkeleton } from '@/components/ui/skeleton';
import { loadAccountOverview } from '@/lib/account/account-overview';
import { drizzleAccountGateway } from '@/lib/account/drizzle-account-gateway';
import { requireViewer } from '@/lib/auth/viewer';

export const metadata = {
	title: 'Sicherheit',
	description: 'Passwort, Passkeys und verbundene MCP-Clients verwalten.',
};

async function SecurityPanels() {
	const viewer = await requireViewer();
	const { connections, hasPassword } = await loadAccountOverview(drizzleAccountGateway, viewer.id);

	return (
		<>
			<PasswordSettings currentEmail={viewer.email} hasPassword={hasPassword} />
			<AccountSettings />
			<ConnectedClients connections={connections} />
		</>
	);
}

export default function SecuritySettingsPage() {
	return (
		<Layout>
			<div className='flex flex-col gap-8 py-2' data-testid='settings-security-page'>
				<SettingsHeader
					description='Schütze dein Konto und verwalte Zugriffe für Geräte und KI-Clients.'
					section='security'
					title='Sicherheit'
				/>
				<Suspense
					fallback={
						<>
							<CardSkeleton className='h-96' />
							<CardSkeleton className='h-128' />
							<CardSkeleton className='h-56' />
						</>
					}
				>
					<SecurityPanels />
				</Suspense>
			</div>
		</Layout>
	);
}
