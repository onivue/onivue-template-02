import { Check, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { TMcpAppInvitation } from '@/features/mcp-app/app-contract';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { INVITATION_STATUS_LABELS, invitationStatus } from '@/features/mcp-app/invitation-status';
import { formatSentDate } from '@/features/mcp-app/view/event-date';

type TInvitationRowProps = {
	invitation: TMcpAppInvitation;
	onCopyLink: () => Promise<null | string>;
	onDelete: () => Promise<null | string>;
	onToggleSent: (sent: boolean) => Promise<null | string>;
};

type TCopyState = { kind: 'copied' } | { kind: 'copying' } | { kind: 'failed'; message: string } | { kind: 'idle' };
type TDeleteState =
	| { kind: 'confirming' }
	| { kind: 'deleting' }
	| { kind: 'failed'; message: string }
	| { kind: 'idle' };
type TSentState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'failed'; message: string };

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

// how long the button shows "Kopiert", before it goes back to inviting another click
const COPY_FEEDBACK_MS = 1600;

function guestLabel(invitation: TMcpAppInvitation): string {
	return invitation.guests.map((guest) => guest.name).join(', ') || 'Diese Einladung';
}

// one invitation: who is on it, what the party answered, and its three actions — mark it sent,
// copy its link, or delete it. sent and the link both run as tool calls too, same as the deletion
// below: the row never touches the database, only the host does that on its behalf.
export function InvitationRow({ invitation, onCopyLink, onDelete, onToggleSent }: TInvitationRowProps) {
	const [deleteState, setDeleteState] = useState<TDeleteState>({ kind: 'idle' });
	const [copyState, setCopyState] = useState<TCopyState>({ kind: 'idle' });
	const [sentState, setSentState] = useState<TSentState>({ kind: 'idle' });

	const label = guestLabel(invitation);
	const status = invitationStatus(invitation);
	const sentAt = formatSentDate(invitation.sentAt);

	const confirmDelete = async () => {
		setDeleteState({ kind: 'deleting' });

		const message = await onDelete();

		setDeleteState(message ? { kind: 'failed', message } : { kind: 'idle' });
	};

	const toggleSent = async () => {
		setSentState({ kind: 'saving' });

		const message = await onToggleSent(!invitation.sentAt);

		setSentState(message ? { kind: 'failed', message } : { kind: 'idle' });
	};

	const copyLink = async () => {
		setCopyState({ kind: 'copying' });

		const message = await onCopyLink();

		if (message) {
			setCopyState({ kind: 'failed', message });

			return;
		}

		setCopyState({ kind: 'copied' });
		setTimeout(() => {
			setCopyState((current) => (current.kind === 'copied' ? { kind: 'idle' } : current));
		}, COPY_FEEDBACK_MS);
	};

	return (
		<li
			className='grid gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3'
			data-testid={`invitation-row-${invitation.id}`}
		>
			<div className='grid min-w-0 gap-1.5'>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='font-bold text-ink'>{label}</span>
					<Badge data-testid={`invitation-status-${invitation.id}`} variant={STATUS_VARIANTS[status]}>
						{INVITATION_STATUS_LABELS[status]}
					</Badge>
				</div>

				<p className='text-sm text-ink-soft'>{sentAt ? `Verschickt am ${sentAt}` : 'Noch nicht verschickt'}</p>

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

			<div className='flex flex-wrap items-center justify-between gap-2'>
				<label className='flex h-7 cursor-pointer items-center gap-2 rounded-full px-2 text-[0.8rem] font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink'>
					<Checkbox
						checked={!!invitation.sentAt}
						data-testid={`sent-${invitation.id}`}
						disabled={sentState.kind === 'saving'}
						onCheckedChange={() => void toggleSent()}
					/>
					Versendet
				</label>

				<div className='flex items-center gap-1.5'>
					<Button
						aria-label={`Link von ${label} kopieren`}
						data-testid={`copy-link-${invitation.id}`}
						disabled={copyState.kind === 'copying'}
						onClick={() => void copyLink()}
						size='sm'
						variant='outline'
					>
						{copyState.kind === 'copied' ? <Check /> : <Copy />}
						{copyState.kind === 'copied' ? 'Kopiert' : 'Link'}
					</Button>

					{deleteState.kind === 'idle' ? (
						<Button
							aria-label={`Einladung von ${label} löschen`}
							data-testid={`delete-invitation-${invitation.id}`}
							onClick={() => setDeleteState({ kind: 'confirming' })}
							size='icon-sm'
							variant='destructive'
						>
							<Trash2 />
						</Button>
					) : null}
				</div>
			</div>

			{sentState.kind === 'failed' ? (
				<p className='design-field-error' data-testid={`sent-error-${invitation.id}`}>
					{sentState.message}
				</p>
			) : null}

			{copyState.kind === 'failed' ? (
				<p className='design-field-error' data-testid={`copy-link-error-${invitation.id}`}>
					{copyState.message}
				</p>
			) : null}

			{deleteState.kind === 'idle' ? null : (
				<div
					className='grid gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3'
					data-testid={`delete-invitation-confirm-${invitation.id}`}
				>
					<p className='text-sm font-bold text-destructive'>Einladung endgültig löschen?</p>
					<p className='text-sm text-ink-soft'>
						{label} und alle Antworten dieser Einladung verschwinden. Der Einladungslink funktioniert danach
						nicht mehr.
					</p>

					{deleteState.kind === 'failed' ? (
						<p className='design-field-error' data-testid={`delete-invitation-error-${invitation.id}`}>
							{deleteState.message}
						</p>
					) : null}

					<div className='flex flex-wrap gap-2'>
						<Button
							data-testid={`delete-invitation-confirmed-${invitation.id}`}
							disabled={deleteState.kind === 'deleting'}
							onClick={() => void confirmDelete()}
							size='sm'
							variant='destructive'
						>
							<Trash2 />
							{deleteState.kind === 'deleting' ? 'Löscht …' : 'Ja, löschen'}
						</Button>
						<Button
							data-testid={`delete-invitation-cancel-${invitation.id}`}
							disabled={deleteState.kind === 'deleting'}
							onClick={() => setDeleteState({ kind: 'idle' })}
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
