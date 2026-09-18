import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { TMcpAppInvitation } from '@/features/mcp-app/app-contract';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { INVITATION_STATUS_LABELS, invitationStatus } from '@/features/mcp-app/invitation-status';
import { formatSentDate } from '@/features/mcp-app/view/event-date';

type TInvitationRowProps = {
	invitation: TMcpAppInvitation;
	onDelete: () => Promise<null | string>;
};

type TDeleteState =
	| { kind: 'confirming' }
	| { kind: 'deleting' }
	| { kind: 'failed'; message: string }
	| { kind: 'idle' };

const STATUS_VARIANTS = {
	accepted: 'default',
	declined: 'destructive',
	open: 'outline',
	partial: 'secondary',
} as const;

const RESPONSE_LABELS = {
	accepted: 'zugesagt',
	declined: 'abgesagt',
	open: 'offen',
} as const;

function guestLabel(invitation: TMcpAppInvitation): string {
	return invitation.guests.map((guest) => guest.name).join(', ') || 'Diese Einladung';
}

// one invitation: who is on it, what the party answered, and the one destructive action. deleting
// is final — the guests and their answers go with it — so the row asks first and names what
// disappears. the deletion itself runs as a tool call through the host, never from here.
export function InvitationRow({ invitation, onDelete }: TInvitationRowProps) {
	const [state, setState] = useState<TDeleteState>({ kind: 'idle' });

	const label = guestLabel(invitation);
	const status = invitationStatus(invitation);
	const sentAt = formatSentDate(invitation.sentAt);

	const confirm = async () => {
		setState({ kind: 'deleting' });

		const message = await onDelete();

		setState(message ? { kind: 'failed', message } : { kind: 'idle' });
	};

	return (
		<li
			className='grid gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3'
			data-testid={`invitation-row-${invitation.id}`}
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='grid min-w-0 gap-1.5'>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-bold text-ink'>{label}</span>
						<Badge data-testid={`invitation-status-${invitation.id}`} variant={STATUS_VARIANTS[status]}>
							{INVITATION_STATUS_LABELS[status]}
						</Badge>
					</div>

					<p className='text-sm text-ink-soft'>
						{sentAt ? `Verschickt am ${sentAt}` : 'Noch nicht verschickt'}
					</p>

					{invitation.guests.length > 1 ? (
						<ul className='grid gap-0.5 text-sm text-ink-soft'>
							{invitation.guests.map((guest) => (
								<li key={guest.id}>
									{guest.name} — {RESPONSE_LABELS[guest.response]}
								</li>
							))}
						</ul>
					) : null}
				</div>

				{state.kind === 'idle' ? (
					<Button
						aria-label={`Einladung von ${label} löschen`}
						data-testid={`delete-invitation-${invitation.id}`}
						onClick={() => setState({ kind: 'confirming' })}
						size='icon-sm'
						variant='destructive'
					>
						<Trash2 />
					</Button>
				) : null}
			</div>

			{state.kind === 'idle' ? null : (
				<div
					className='grid gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3'
					data-testid={`delete-invitation-confirm-${invitation.id}`}
				>
					<p className='text-sm font-bold text-destructive'>Einladung endgültig löschen?</p>
					<p className='text-sm text-ink-soft'>
						{label} und alle Antworten dieser Einladung verschwinden. Der Einladungslink funktioniert danach
						nicht mehr.
					</p>

					{state.kind === 'failed' ? (
						<p className='design-field-error' data-testid={`delete-invitation-error-${invitation.id}`}>
							{state.message}
						</p>
					) : null}

					<div className='flex flex-wrap gap-2'>
						<Button
							data-testid={`delete-invitation-confirmed-${invitation.id}`}
							disabled={state.kind === 'deleting'}
							onClick={confirm}
							size='sm'
							variant='destructive'
						>
							<Trash2 />
							{state.kind === 'deleting' ? 'Löscht …' : 'Ja, löschen'}
						</Button>
						<Button
							data-testid={`delete-invitation-cancel-${invitation.id}`}
							disabled={state.kind === 'deleting'}
							onClick={() => setState({ kind: 'idle' })}
							size='sm'
							variant='outline'
						>
							Abbrechen
						</Button>
					</div>
				</div>
			)}
		</li>
	);
}
