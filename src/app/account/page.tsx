import { Layout } from '@/components/layout/layout';
import { PagePlaceholder } from '@/components/layout/page-placeholder';

export default function AccountPage() {
	return (
		<Layout>
			<PagePlaceholder label='account' title='Account' description='lorem ipsum' testId='account-page' />
		</Layout>
	);
}
