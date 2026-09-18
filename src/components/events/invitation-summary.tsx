'use client';

import { Check, Pencil, X } from 'lucide-react';

import type { InvitationFormGuest } from '@/components/events/invitation-form';
import type { AnswerValue, FormFieldDefinition, Submission } from '@/lib/events/form-schema';

import { InvitationDeadline } from '@/components/events/invitation-deadline';
import { Divided } from '@/components/layout/divided';
import { Button } from '@/components/ui/button';
import { formatBerlinShort } from '@/lib/events/berlin-time';
import { isFieldVisible } from '@/lib/events/form-schema';
import { cn } from '@/lib/utils';

type InvitationSummaryProps = {
	closedNote?: null | string;
	closesAt?: Date | null;
	fields: FormFieldDefinition[];
	guests: InvitationFormGuest[];
	onEdit?: () => void;
	submission: Submission;
};

const RESPONSE_LABELS = {
	accepted: 'Ist dabei',
	declined: 'Kann nicht',
	open: 'Noch offen',
} as const;

const RESPONSE_STYLES = {
	accepted: 'bg-accent-strong/15 text-accent-strong',
	declined: 'bg-foreground/10 text-ink-soft',
	open: 'bg-muted text-ink-soft',
} as const;

// an answer is stored as option ids; the guest wants to read the labels they picked
function answerText(field: FormFieldDefinition, value: AnswerValue | undefined): null | string {
	const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
	const filled = values.filter((entry) => entry.trim().length > 0);

	if (filled.length === 0) {
		return null;
	}

	if (field.options.length === 0) {
		return filled.join(', ');
	}

	const labels = filled.map((entry) => field.options.find((option) => option.id === entry)?.label ?? entry);

	return labels.join(', ');
}

function guestName(guest: InvitationFormGuest): string {
	return [guest.firstName, guest.lastName].filter(Boolean).join(' ');
}

function AnswerRow({ label, value }: { label: string; value: string }) {
	return (
		<div className='grid gap-0.5'>
			<dt className='design-label'>{label}</dt>
			<dd className='text-sm whitespace-pre-line'>{value}</dd>
		</div>
	);
}

// what the guest sees once they have answered: their own reply, read back to them, with the way
// into editing it again one click away
export function InvitationSummary({
	closedNote,
	closesAt,
	fields,
	guests,
	onEdit,
	submission,
}: InvitationSummaryProps) {
	const invitationAnswers = fields
		.filter((field) => field.scope === 'invitation')
		.map((field) => ({ field, text: answerText(field, submission.answers[field.id]) }))
		.filter((entry) => entry.text !== null);

	return (
		<Divided className='design-panel p-5 sm:p-6' data-testid='invitation-summary'>
			{closesAt ? <InvitationDeadline closesAt={closesAt} isAnswered /> : null}

			{closedNote ? (
				<p
					className='rounded-2xl bg-muted px-4 py-3 text-sm text-ink-soft'
					data-testid='invitation-closed-note'
				>
					{closedNote}
				</p>
			) : null}

			{guests.map((guest) => {
				const state = submission.guests[guest.id];

				if (!state) {
					return null;
				}

				const answers = fields
					.filter((field) => field.scope === 'guest' && isFieldVisible(field, state.response))
					.map((field) => ({ field, text: answerText(field, state.answers[field.id]) }))
					.filter((entry) => entry.text !== null);

				return (
					<div className='grid gap-3' data-testid={`summary-guest-${guest.id}`} key={guest.id}>
						<div className='flex flex-wrap items-center justify-between gap-2'>
							<h2 className='text-lg font-bold'>{guestName(guest)}</h2>
							<span
								className={cn(
									'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold',
									RESPONSE_STYLES[state.response]
								)}
								data-testid={`summary-response-${guest.id}`}
							>
								{state.response === 'accepted' ? <Check aria-hidden='true' className='size-4' /> : null}
								{state.response === 'declined' ? <X aria-hidden='true' className='size-4' /> : null}
								{RESPONSE_LABELS[state.response]}
							</span>
						</div>

						{answers.length > 0 ? (
							<dl className='grid gap-3'>
								{answers.map((entry) => (
									<AnswerRow key={entry.field.id} label={entry.field.label} value={entry.text!} />
								))}
							</dl>
						) : null}

						{guest.respondedAt ? (
							<p className='text-xs text-ink-soft'>
								Zuletzt geändert am {formatBerlinShort(guest.respondedAt)}
							</p>
						) : null}
					</div>
				);
			})}

			{invitationAnswers.length > 0 ? (
				<dl className='grid gap-3' data-testid='summary-invitation-fields'>
					{invitationAnswers.map((entry) => (
						<AnswerRow key={entry.field.id} label={entry.field.label} value={entry.text!} />
					))}
				</dl>
			) : null}

			{onEdit ? (
				<Button className='w-full' data-testid='edit-response' onClick={onEdit} size='xl' variant='outline'>
					<Pencil data-icon='inline-start' /> Antwort ändern
				</Button>
			) : null}
		</Divided>
	);
}
