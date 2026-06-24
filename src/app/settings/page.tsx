import { Layout } from '@/components/layout/layout';
import { PagePlaceholder } from '@/components/layout/page-placeholder';

export default function SettingsPage() {
	return (
		<Layout>
			<PagePlaceholder label='settings' title='Settings' description='lorem ipsum' testId='settings-page' />
		</Layout>
	);
}
