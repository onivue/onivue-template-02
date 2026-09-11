import { redirect } from 'next/navigation';

import { settingsProfilePath } from '@/config/routes';

export const metadata = {
	title: 'Settings',
	description: 'Einstellungen der App.',
};

export default function SettingsPage() {
	redirect(settingsProfilePath());
}
