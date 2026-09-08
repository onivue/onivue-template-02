'use client';

import { Bot, Unplug } from 'lucide-react';

import type { McpConnectionSummary } from '@/lib/mcp/mcp-connection';

import { Button } from '@/components/ui/button';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { labelScope } from '@/lib/mcp/mcp-scopes';

type ConnectedClientsProps = {
	connections: McpConnectionSummary[];
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

export function ConnectedClients({ connections }: ConnectedClientsProps) {
	const { actions, isBusy, isRunning } = useAccountActions();

	return (
		<section className='design-panel grid content-start gap-5 p-5 sm:p-6' data-testid='connected-clients-section'>
			<div className='grid gap-2'>
				<p className='design-section-label w-fit px-3 py-1.5'>MCP</p>
				<h2 className='text-xl font-bold text-foreground'>Verbundene Clients</h2>
				<p className='design-page-description max-w-2xl'>
					KI-Agenten, denen du Zugriff auf dein Konto erlaubt hast. Aktuell{' '}
					{connections.length === 1 ? 'ist 1 Client' : `sind ${connections.length} Clients`} verbunden.
				</p>
			</div>

			<div className='grid gap-3' data-testid='connected-clients-list'>
				{connections.length === 0 ? (
					<p
						className='rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm font-medium text-muted-foreground'
						data-testid='connected-clients-empty'
					>
						Keine verbundenen Clients.
					</p>
				) : null}
				{connections.map((connection) => (
					<div
						key={connection.id}
						className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3 sm:p-4'
						data-testid='connected-client-item'
					>
						<div className='flex min-w-0 flex-1 items-center gap-3'>
							<span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
								<Bot className='size-5' aria-hidden='true' />
							</span>
							<span className='grid min-w-0 gap-1'>
								<span className='truncate font-bold text-foreground'>{connection.clientName}</span>
								<span className='truncate text-xs font-medium text-muted-foreground'>
									{connection.connectedAt
										? `Verbunden seit ${connection.connectedAt.toLocaleDateString('de-DE', DATE_FORMAT)}`
										: 'Verbunden'}
									{connection.scopes.length > 0
										? ` · ${connection.scopes.map(labelScope).join(', ')}`
										: ''}
								</span>
							</span>
						</div>
						<Button
							type='button'
							variant='destructive'
							size='lg'
							className='rounded-full'
							disabled={isBusy}
							onClick={() => void actions.revokeConnection(connection.id, connection.clientId)}
							data-testid='revoke-connection-button'
						>
							<Unplug data-icon='inline-start' aria-hidden='true' />
							{isRunning('revoke-connection', connection.id) ? 'Trenne...' : 'Trennen'}
						</Button>
					</div>
				))}
			</div>
		</section>
	);
}
