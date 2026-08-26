import { ProfileSettings } from '@/components/account/profile-settings';
import { Layout } from '@/components/layout/layout';
import { requireViewer } from '@/lib/auth/viewer';

export const metadata = {
	title: 'Settings | onivue',
	description: 'Profilinformationen verwalten.',
};

export default async function SettingsPage() {
	const viewer = await requireViewer();

	return (
		<Layout>
			<div className='flex flex-col gap-6 py-2' data-testid='settings-page'>
				<header className='grid max-w-2xl gap-3'>
					<p className='design-section-label w-fit px-3 py-1.5'>Settings</p>
					<div className='grid gap-2'>
						<h1 className='design-page-title text-[clamp(2rem,5vw,3.5rem)]'>Settings</h1>
						<p className='design-page-description'>Verwalte deine Profilinformationen.</p>
					</div>
				</header>
				<ProfileSettings
					currentUsername={viewer.username}
					currentFirstName={viewer.firstName}
					currentLastName={viewer.lastName}
				/>
			</div>
		</Layout>
	);
}
