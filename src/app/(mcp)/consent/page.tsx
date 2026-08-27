import { Layout } from '@/components/layout/layout';
import { ConsentForm } from '@/components/mcp/consent-form';
import { requireViewer } from '@/lib/auth/viewer';
import { findOAuthClient } from '@/lib/mcp/mcp-client-lookup';
import { parseScopes } from '@/lib/mcp/mcp-scopes';

export const metadata = {
	title: 'Zugriff bestätigen | onivue',
	description: 'Bestätige, worauf ein verbundener Client zugreifen darf.',
};

type ConsentPageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
	const value = params[key];

	return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
	await requireViewer();

	const params = await searchParams;
	const clientId = readParam(params, 'client_id');
	const scopes = parseScopes(readParam(params, 'scope'));
	const client = clientId ? await findOAuthClient(clientId) : null;

	return (
		<Layout>
			<div className='flex flex-col gap-6 py-2' data-testid='consent-page'>
				<header className='grid max-w-2xl gap-3'>
					<p className='design-section-label w-fit px-3 py-1.5'>Zugriff</p>
					<div className='grid gap-2'>
						<h1 className='design-page-title text-[clamp(2rem,5vw,3.5rem)]'>Zugriff bestätigen</h1>
						<p className='design-page-description'>
							Ein Client möchte in deinem Namen auf onivue zugreifen. Prüfe, was er darf, bevor du
							zustimmst.
						</p>
					</div>
				</header>
				<div className='max-w-md'>
					{clientId ? (
						<ConsentForm
							clientName={client?.name ?? clientId}
							clientUri={client?.uri ?? null}
							scopes={scopes}
						/>
					) : (
						<div className='design-panel grid gap-3 p-6' data-testid='consent-missing-request'>
							<p className='text-lg font-bold text-foreground'>Keine offene Anfrage</p>
							<p className='design-page-description'>
								Diese Seite wird automatisch geöffnet, wenn ein Client Zugriff anfragt.
							</p>
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
}
