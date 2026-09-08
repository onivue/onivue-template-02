import { Inbox } from 'lucide-react';
import { Suspense } from 'react';

import { Layout } from '@/components/layout/layout';
import { ConsentForm } from '@/components/mcp/consent-form';
import { ConsentNotice } from '@/components/mcp/consent-notice';
import { CardSkeleton } from '@/components/ui/skeleton';
import { requireViewer } from '@/lib/auth/viewer';
import { findOAuthClient } from '@/lib/mcp/mcp-client-lookup';
import { parseScopes } from '@/lib/mcp/mcp-scopes';

export const metadata = {
	title: 'Zugriff bestätigen',
	description: 'Bestätige, worauf ein verbundener Client zugreifen darf.',
};

type ConsentPageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
	const value = params[key];

	return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

// the request being confirmed is entirely in the url, so it waits on its own while the page around
// it — which says what this screen is for — ships with the shell
async function ConsentRequest({ searchParams }: ConsentPageProps) {
	const viewer = await requireViewer();

	const params = await searchParams;
	const clientId = readParam(params, 'client_id');
	const scopes = parseScopes(readParam(params, 'scope'));
	const client = clientId ? await findOAuthClient(clientId) : null;

	if (!clientId) {
		return (
			<ConsentNotice
				description='Diese Seite wird automatisch geöffnet, wenn ein Client Zugriff anfragt.'
				icon={Inbox}
				testId='consent-missing-request'
				title='Keine offene Anfrage'
			/>
		);
	}

	return (
		<ConsentForm
			clientName={client?.name ?? clientId}
			clientUri={client?.uri ?? null}
			scopes={scopes}
			viewerEmail={viewer.email}
		/>
	);
}

export default function ConsentPage({ searchParams }: ConsentPageProps) {
	return (
		<Layout>
			<div className='flex flex-col gap-6 py-2' data-testid='consent-page'>
				<header className='grid max-w-2xl gap-3'>
					<p className='design-section-label w-fit px-3 py-1.5'>Zugriff</p>
					<div className='grid gap-2'>
						<h1 className='design-page-title text-[clamp(2rem,5vw,3.5rem)]'>Zugriff bestätigen</h1>
						<p className='design-page-description'>
							Prüfe, was der Client darf, bevor du zustimmst. Du kannst den Zugriff später jederzeit
							wieder trennen.
						</p>
					</div>
				</header>
				<Suspense fallback={<CardSkeleton className='h-96' />}>
					<ConsentRequest searchParams={searchParams} />
				</Suspense>
			</div>
		</Layout>
	);
}
