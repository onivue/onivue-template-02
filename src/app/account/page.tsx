import { redirect } from 'next/navigation';

import { settingsProfilePath } from '@/config/routes';

export default function AccountPage() {
	redirect(settingsProfilePath());
}
