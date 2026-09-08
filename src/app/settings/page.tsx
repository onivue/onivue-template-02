import { Layout } from '@/components/layout/layout';
import { PagePlaceholder } from '@/components/layout/page-placeholder';

export const metadata = {
	title: 'Settings',
	description: 'Einstellungen der App.',
};

export default function SettingsPage() {
	return (
		<Layout>
			<PagePlaceholder label='settings' title='Settings' description='lorem ipsum' testId='settings-page' />
		</Layout>
	);
}
