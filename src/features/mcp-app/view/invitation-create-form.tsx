import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import type { TAddInvitationsOutcome } from '@/features/mcp-app/view/use-events-app';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseGuestList } from '@/lib/events/guest-list-parser';

type TInvitationCreateFormProps = {
	onSubmit: (guestList: string) => Promise<TAddInvitationsOutcome>;
};

type TStatus =
	| { count: number; kind: 'created' }
	| { kind: 'idle' }
	| { kind: 'submitting' }
	| { kind: 'failed'; message: string };

const PLACEHOLDER = `Anna Meier, Ben Meier
Familie Schmidt, Lea Schmidt, Tim Schmidt
Oma`;

// the same parser that runs on the server previews the paste here, so what is shown is what will
// be created — the app's own take on BulkInviteForm's UX (src/components/events/bulk-invite-form.tsx)
export function InvitationCreateForm({ onSubmit }: TInvitationCreateFormProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [raw, setRaw] = useState('');
	const [status, setStatus] = useState<TStatus>({ kind: 'idle' });

	if (!isOpen) {
		return (
			<Button data-testid='invitation-create-open' onClick={() => setIsOpen(true)} size='sm' variant='outline'>
				<Plus /> Einladungen anlegen
			</Button>
		);
	}

	const close = () => {
		setIsOpen(false);
		setRaw('');
		setStatus({ kind: 'idle' });
	};

	const submit = async () => {
		setStatus({ kind: 'submitting' });

		const outcome = await onSubmit(raw);

		if ('error' in outcome) {
			setStatus({ kind: 'failed', message: outcome.error });

			return;
		}

		setRaw('');
		setStatus({ count: outcome.created, kind: 'created' });
	};

	const preview = parseGuestList(raw);

	return (
		<div
			className='grid gap-2 rounded-2xl border border-border bg-surface-elevated p-3'
			data-testid='invitation-create-form'
		>
			<div className='flex items-start justify-between gap-2'>
				<p className='text-sm text-ink-soft'>Eine Zeile ist eine Einladung, Personen mit Komma trennen.</p>
				<Button
					aria-label='Eingabe schließen'
					data-testid='invitation-create-close'
					onClick={close}
					size='icon-sm'
					variant='ghost'
				>
					<X />
				</Button>
			</div>

			<Textarea
				data-testid='invitation-create-input'
				disabled={status.kind === 'submitting'}
				onChange={(nativeEvent) => {
					setRaw(nativeEvent.target.value);
					setStatus({ kind: 'idle' });
				}}
				placeholder={PLACEHOLDER}
				rows={4}
				value={raw}
			/>

			{raw.trim() && preview.issues.length > 0 ? (
				<ul className='grid gap-1'>
					{preview.issues.map((issue) => (
						<li className='design-field-error' key={`${issue.line}-${issue.message}`}>
							Zeile {issue.line}: {issue.message}
						</li>
					))}
				</ul>
			) : null}

			{status.kind === 'failed' ? (
				<p className='design-field-error' data-testid='invitation-create-error'>
					{status.message}
				</p>
			) : null}

			{status.kind === 'created' ? (
				<p className='text-sm text-ink-soft' data-testid='invitation-create-success'>
					{status.count} Einladung{status.count === 1 ? '' : 'en'} angelegt.
				</p>
			) : null}

			<Button
				className='w-fit'
				data-testid='invitation-create-submit'
				disabled={status.kind === 'submitting' || preview.invitations.length === 0}
				onClick={() => void submit()}
				size='sm'
				variant='strong'
			>
				{status.kind === 'submitting' ? 'Wird angelegt …' : 'Anlegen'}
			</Button>
		</div>
	);
}
