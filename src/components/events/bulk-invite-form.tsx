'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseGuestList } from '@/lib/events/guest-list-parser';
import { addInvitations } from '@/lib/events/invitation-actions';

type BulkInviteFormProps = {
	// the first guests are the whole job; later they are one task among many, so it starts folded
	defaultOpen?: boolean;
	eventId: string;
};

const PLACEHOLDER = `Anna Meier, Ben Meier
Familie Schmidt, Lea Schmidt, Tim Schmidt
Oma`;

// the same parser that runs on the server previews the paste here, so what is shown is what will
// be created
export function BulkInviteForm({ defaultOpen = false, eventId }: BulkInviteFormProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [raw, setRaw] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const preview = parseGuestList(raw);

	const submit = async () => {
		setIsSaving(true);

		const result = await addInvitations(eventId, raw);

		setIsSaving(false);

		if (!result.success) {
			toast.error(result.message);

			return;
		}

		setRaw('');
		toast.success(`${result.data.created} Einladung(en) angelegt.`);
	};

	if (!isOpen) {
		return (
			<Button
				className='w-fit'
				data-testid='bulk-invite-open'
				onClick={() => setIsOpen(true)}
				size='xl'
				variant='outline'
			>
				<Plus data-icon='inline-start' /> Gäste eintragen
			</Button>
		);
	}

	return (
		<section className='design-panel grid gap-3 p-5 sm:p-6' data-testid='bulk-invite-form'>
			<div className='flex flex-wrap items-start justify-between gap-2'>
				<div className='grid gap-1'>
					<h3 className='design-label'>Gäste eintragen</h3>
					<p className='text-xs text-ink-soft'>
						Eine Zeile ist eine Einladung. Mehrere Personen mit Komma trennen — die erste Person ist die
						Hauptperson.
					</p>
				</div>
				<Button
					aria-label='Eingabe schließen'
					data-testid='bulk-invite-close'
					onClick={() => setIsOpen(false)}
					size='icon-sm'
					variant='ghost'
				>
					<X />
				</Button>
			</div>

			<Textarea
				data-testid='bulk-invite-input'
				onChange={(nativeEvent) => setRaw(nativeEvent.target.value)}
				placeholder={PLACEHOLDER}
				rows={5}
				value={raw}
			/>

			{raw.trim() ? (
				<div className='grid gap-2 text-sm' data-testid='bulk-invite-preview'>
					<p className='text-ink-soft'>
						{preview.invitations.length} Einladung(en) mit{' '}
						{preview.invitations.reduce((total, invitation) => total + invitation.guests.length, 0)}{' '}
						Person(en).
					</p>
					{preview.issues.length > 0 ? (
						<ul className='grid gap-1'>
							{preview.issues.map((issue) => (
								<li className='design-field-error' key={`${issue.line}-${issue.message}`}>
									Zeile {issue.line}: {issue.message} („{issue.text}“)
								</li>
							))}
						</ul>
					) : null}
				</div>
			) : null}

			<Button
				className='w-fit'
				data-testid='bulk-invite-submit'
				disabled={isSaving || preview.invitations.length === 0}
				onClick={submit}
				size='xl'
				variant='strong'
			>
				{isSaving ? 'Wird angelegt …' : 'Einladungen anlegen'}
			</Button>
		</section>
	);
}
