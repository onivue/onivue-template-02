'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { describeScope } from '@/lib/mcp/mcp-scopes';

type ConsentFormProps = {
	clientName: string;
	clientUri: string | null;
	scopes: string[];
};

type Decision = 'accepted' | 'denied' | null;

const QUERY_PREFIX = /^\?/;

export function ConsentForm({ clientName, clientUri, scopes }: ConsentFormProps) {
	const { actions, isBusy } = useAccountActions();
	const [decision, setDecision] = useState<Decision>(null);

	async function handleDecision(accept: boolean): Promise<void> {
		// the query has to go back byte-for-byte: it is signed, and `ba_param` repeats one entry per
		// signed parameter. rebuilding it from parsed searchParams silently drops those duplicates and
		// the signature no longer verifies — so it is read straight from the address bar instead.
		const oauthQuery = window.location.search.replace(QUERY_PREFIX, '');
		const outcome = await actions.decideConsent(accept, oauthQuery);

		// on success the provider usually redirects the client away; this panel is what remains when
		// it has nowhere to send them back to
		if (outcome.ok) {
			setDecision(accept ? 'accepted' : 'denied');
		}
	}

	if (decision) {
		return (
			<div className='design-panel grid gap-3 p-6' data-testid='consent-result'>
				<p className='text-lg font-bold text-foreground'>
					{decision === 'accepted' ? 'Zugriff erlaubt' : 'Zugriff abgelehnt'}
				</p>
				<p className='design-page-description'>Du kannst jetzt zu deinem KI-Agenten zurückkehren.</p>
			</div>
		);
	}

	return (
		<div className='design-panel grid gap-5 p-6' data-testid='consent-form'>
			<p className='design-page-description'>
				<span className='font-bold text-foreground'>{clientName}</span> möchte in deinem Namen auf onivue
				zugreifen.
				{clientUri ? <span className='block text-xs break-all text-muted-foreground'>{clientUri}</span> : null}
			</p>

			<div className='grid gap-2' data-testid='consent-scopes'>
				<p className='design-label'>Dafür wird um Erlaubnis gebeten:</p>
				<ul className='grid gap-2'>
					{scopes.map((scope) => (
						<li
							key={scope}
							className='rounded-2xl border border-border bg-background p-3 text-sm font-medium text-foreground'
							data-testid='consent-scope-item'
						>
							{describeScope(scope)}
						</li>
					))}
				</ul>
			</div>

			<div className='flex gap-3'>
				<Button
					variant='strong'
					size='xl'
					disabled={isBusy}
					onClick={() => void handleDecision(true)}
					data-testid='consent-accept-button'
				>
					{isBusy ? 'Moment...' : 'Erlauben'}
				</Button>
				<Button
					variant='outline'
					size='xl'
					disabled={isBusy}
					onClick={() => void handleDecision(false)}
					data-testid='consent-deny-button'
				>
					Ablehnen
				</Button>
			</div>
		</div>
	);
}
