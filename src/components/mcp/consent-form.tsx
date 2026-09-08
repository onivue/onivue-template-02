'use client';

import {
	Bot,
	CalendarCog,
	CalendarDays,
	CircleCheck,
	CircleSlash,
	KeyRound,
	Link2,
	RefreshCw,
	ShieldCheck,
	User,
	UserPen,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ConsentNotice } from '@/components/mcp/consent-notice';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { describeScope, labelScope, MCP_SCOPE_IDS } from '@/lib/mcp/mcp-scopes';

type ConsentFormProps = {
	clientName: string;
	clientUri: string | null;
	scopes: string[];
	viewerEmail: string;
};

type Decision = 'accepted' | 'denied' | null;

const QUERY_PREFIX = /^\?/;

// the icon carries what the scope touches, so the eye can sort the list before reading it
const SCOPE_ICONS: Record<string, typeof Bot> = {
	[MCP_SCOPE_IDS.eventsLinks]: Link2,
	[MCP_SCOPE_IDS.eventsRead]: CalendarDays,
	[MCP_SCOPE_IDS.eventsWrite]: CalendarCog,
	[MCP_SCOPE_IDS.offline]: RefreshCw,
	[MCP_SCOPE_IDS.read]: User,
	[MCP_SCOPE_IDS.write]: UserPen,
};

function ScopeItem({ scope }: { scope: string }) {
	const Icon = SCOPE_ICONS[scope] ?? KeyRound;
	const label = labelScope(scope);
	const description = describeScope(scope);

	return (
		<li
			className='flex items-start gap-3 rounded-2xl border border-border bg-background p-3.5'
			data-testid='consent-scope-item'
		>
			<span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink'>
				<Icon aria-hidden='true' className='size-4' />
			</span>
			<span className='grid min-w-0 gap-1'>
				<span className='text-sm font-bold text-foreground'>{label}</span>
				{/* an unknown scope falls back to its own id in both places; printing it twice says nothing */}
				{description === label ? null : (
					<span className='text-[0.8rem] leading-relaxed text-ink-soft'>{description}</span>
				)}
			</span>
		</li>
	);
}

export function ConsentForm({ clientName, clientUri, scopes, viewerEmail }: ConsentFormProps) {
	const { actions, isBusy, isRunning } = useAccountActions();
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
			<ConsentNotice
				action={
					<Button
						className='mt-2'
						data-testid='consent-result-account-link'
						nativeButton={false}
						render={<Link href={APP_ROUTES.ACCOUNT} />}
						size='xl'
						variant='outline'
					>
						Verbundene Clients
					</Button>
				}
				description={
					decision === 'accepted'
						? `${clientName} ist jetzt verbunden. Du kannst zu deinem KI-Agenten zurückkehren.`
						: `${clientName} hat keinen Zugriff bekommen. Du kannst zu deinem KI-Agenten zurückkehren.`
				}
				icon={decision === 'accepted' ? CircleCheck : CircleSlash}
				testId='consent-result'
				title={decision === 'accepted' ? 'Zugriff erlaubt' : 'Zugriff abgelehnt'}
				tone={decision === 'accepted' ? 'success' : 'neutral'}
			/>
		);
	}

	return (
		<div className='design-panel grid gap-6 p-6 sm:p-7' data-testid='consent-form'>
			<div className='flex items-start gap-4'>
				<span className='flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
					<Bot aria-hidden='true' className='size-6' />
				</span>
				<div className='grid min-w-0 gap-1'>
					<p className='text-lg leading-tight font-bold text-foreground'>{clientName}</p>
					<p className='design-page-description'>möchte in deinem Namen auf onivue zugreifen.</p>
					{clientUri ? (
						<p className='text-xs font-medium break-all text-ink-soft' data-testid='consent-client-uri'>
							{clientUri}
						</p>
					) : null}
				</div>
			</div>

			{/* which account is being handed over is half the decision, and a client can open this
			    screen in a browser that is signed in as someone else */}
			<p
				className='flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-xs font-medium text-ink-soft'
				data-testid='consent-viewer'
			>
				<User aria-hidden='true' className='size-3.5 shrink-0' />
				Angemeldet als
				<span className='font-bold break-all text-foreground'>{viewerEmail}</span>
			</p>

			<div className='grid gap-2.5' data-testid='consent-scopes'>
				<p className='design-label'>Dafür wird um Erlaubnis gebeten</p>
				<ul className='grid gap-2'>
					{scopes.map((scope) => (
						<ScopeItem key={scope} scope={scope} />
					))}
				</ul>
			</div>

			{/* both decisions get the same width: this is a choice, not a form with one obvious answer */}
			<div className='grid gap-4'>
				<div className='grid gap-2 sm:grid-cols-2'>
					<Button
						data-testid='consent-accept-button'
						disabled={isBusy}
						onClick={() => void handleDecision(true)}
						size='xl'
						variant='strong'
					>
						<ShieldCheck aria-hidden='true' data-icon='inline-start' />
						{isRunning('grant-consent') ? 'Moment...' : 'Erlauben'}
					</Button>
					<Button
						data-testid='consent-deny-button'
						disabled={isBusy}
						onClick={() => void handleDecision(false)}
						size='xl'
						variant='outline'
					>
						<X aria-hidden='true' data-icon='inline-start' />
						{isRunning('deny-consent') ? 'Moment...' : 'Ablehnen'}
					</Button>
				</div>

				<p className='text-xs font-medium text-ink-soft'>
					Du kannst diesen Zugriff jederzeit unter{' '}
					<Link
						className='font-bold text-accent-strong underline-offset-4 hover:underline'
						data-testid='consent-account-link'
						href={APP_ROUTES.ACCOUNT}
					>
						Account
					</Link>{' '}
					wieder trennen.
				</p>
			</div>
		</div>
	);
}
