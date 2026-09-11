import { Suspense } from 'react';

import { ProfileSettings } from '@/components/account/profile-settings';
import { SettingsHeader } from '@/components/account/settings-header';
import { Layout } from '@/components/layout/layout';
import { CardSkeleton } from '@/components/ui/skeleton';
import { requireViewer } from '@/lib/auth/viewer';

export const metadata = {
	title: 'Profil',
	description: 'Benutzername, Name und E-Mail-Adresse verwalten.',
};

async function ProfilePanel() {
	const viewer = await requireViewer();

	return (
		<ProfileSettings
			currentEmail={viewer.email}
			currentFirstName={viewer.firstName}
			currentLastName={viewer.lastName}
			currentUsername={viewer.username}
		/>
	);
}

export default function ProfileSettingsPage() {
	return (
		<Layout>
			<div className='flex flex-col gap-8 py-2' data-testid='settings-profile-page'>
				<SettingsHeader
					description='Verwalte die Angaben, unter denen du in onivue sichtbar bist.'
					section='profile'
					title='Profil'
				/>
				<Suspense fallback={<CardSkeleton className='h-164' />}>
					<ProfilePanel />
				</Suspense>
			</div>
		</Layout>
	);
}
