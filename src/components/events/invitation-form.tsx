'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { ActionResult } from '@/lib/events/action-result';
import type { AnswerValue, FormFieldDefinition, GuestResponse, Submission } from '@/lib/events/form-schema';

import { InvitationField } from '@/components/events/invitation-field';
import { InvitationSummary } from '@/components/events/invitation-summary';
import { Button } from '@/components/ui/button';
import { isFieldVisible } from '@/lib/events/form-schema';

export type InvitationFormGuest = {
	firstName: string;
	id: string;
	lastName: null | string;
	respondedAt: Date | null;
	response: GuestResponse;
};

// where the guest stands, held by the page because the page lays out around it: the date and the
// way there replace the bare facts once somebody is coming, and that is not the form's to decide.
export type AnswerState = {
	// at least one guest on this invitation said yes
	isAttending: boolean;
	// the answer is in and is read back, rather than being filled in
	isAnswered: boolean;
};

type InvitationFormProps = {
	answer: AnswerState;
	answers: { fieldId: string; guestId: null | string; value: AnswerValue }[];
	closedReason?: 'archived' | 'deadline-passed';
	fields: FormFieldDefinition[];
	guests: InvitationFormGuest[];
	onAnswerChange: (answer: AnswerState) => void;
	onSubmit?: (submission: Submission) => Promise<ActionResult>;
};

// somebody who has already answered lands on their answer, not on an empty form again
export function initialAnswerState(guests: InvitationFormGuest[]): AnswerState {
	return {
		isAttending: guests.some((guest) => guest.response === 'accepted'),
		isAnswered: guests.some((guest) => guest.respondedAt !== null),
	};
}

// the answer can only be read, never changed: the window is shut, or there is nothing to submit to
export function isAnswerReadOnly(
	closedReason: InvitationFormProps['closedReason'],
	onSubmit: InvitationFormProps['onSubmit']
): boolean {
	return Boolean(closedReason) || !onSubmit;
}

const CLOSED_MESSAGES = {
	archived: 'Dieses Event ist abgeschlossen. Deine Antwort bleibt sichtbar, lässt sich aber nicht mehr ändern.',
	'deadline-passed':
		'Die Frist ist abgelaufen. Deine Antwort bleibt sichtbar — für eine Änderung wende dich bitte direkt an den Gastgeber.',
} as const;

function emptyValue(field: FormFieldDefinition): AnswerValue {
	return field.type === 'checkbox' ? [] : '';
}

function initialState(props: InvitationFormProps): Submission {
	const guestAnswers = (guestId: string) =>
		Object.fromEntries(
			props.fields
				.filter((field) => field.scope === 'guest')
				.map((field) => [
					field.id,
					props.answers.find((answer) => answer.guestId === guestId && answer.fieldId === field.id)?.value ??
						emptyValue(field),
				])
		);

	return {
		answers: Object.fromEntries(
			props.fields
				.filter((field) => field.scope === 'invitation')
				.map((field) => [
					field.id,
					props.answers.find((answer) => answer.guestId === null && answer.fieldId === field.id)?.value ??
						emptyValue(field),
				])
		),
		guests: Object.fromEntries(
			props.guests.map((guest) => [guest.id, { answers: guestAnswers(guest.id), response: guest.response }])
		),
	};
}

function guestName(guest: InvitationFormGuest): string {
	return [guest.firstName, guest.lastName].filter(Boolean).join(' ');
}

export function InvitationForm(props: InvitationFormProps) {
	const [submission, setSubmission] = useState<Submission>(() => initialState(props));
	const [isSaving, setIsSaving] = useState(false);
	const isReadOnly = isAnswerReadOnly(props.closedReason, props.onSubmit);

	const setResponse = (guestId: string, response: GuestResponse) => {
		setSubmission((current) => ({
			...current,
			guests: { ...current.guests, [guestId]: { ...current.guests[guestId]!, response } },
		}));
	};

	const setGuestAnswer = (guestId: string, fieldId: string, value: AnswerValue) => {
		setSubmission((current) => ({
			...current,
			guests: {
				...current.guests,
				[guestId]: {
					...current.guests[guestId]!,
					answers: { ...current.guests[guestId]!.answers, [fieldId]: value },
				},
			},
		}));
	};

	const setInvitationAnswer = (fieldId: string, value: AnswerValue) => {
		setSubmission((current) => ({ ...current, answers: { ...current.answers, [fieldId]: value } }));
	};

	const save = async () => {
		if (!props.onSubmit) {
			return;
		}

		setIsSaving(true);

		const result = await props.onSubmit(submission);

		setIsSaving(false);

		if (result.success) {
			toast.success('Danke! Deine Antwort ist gespeichert.');
			// the answer is in — read it back instead of leaving the form open
			props.onAnswerChange({
				isAttending: Object.values(submission.guests).some((guest) => guest.response === 'accepted'),
				isAnswered: true,
			});

			return;
		}

		toast.error(result.message);
	};

	if (isReadOnly || props.answer.isAnswered) {
		return (
			<InvitationSummary
				closedNote={props.closedReason ? CLOSED_MESSAGES[props.closedReason] : null}
				fields={props.fields}
				guests={props.guests}
				onEdit={isReadOnly ? undefined : () => props.onAnswerChange({ ...props.answer, isAnswered: false })}
				submission={submission}
			/>
		);
	}

	return (
		<div className='grid gap-6' data-testid='invitation-form'>
			{props.guests.map((guest) => {
				const state = submission.guests[guest.id];

				if (!state) {
					return null;
				}

				return (
					<section
						className='design-panel grid gap-4 p-5 sm:p-6'
						data-testid={`guest-${guest.id}`}
						key={guest.id}
					>
						<h2 className='text-lg font-bold'>{guestName(guest)}</h2>

						<fieldset className='grid gap-2'>
							<legend className='design-label mb-2'>Bist du dabei?</legend>
							<div className='flex gap-2'>
								<Button
									aria-pressed={state.response === 'accepted'}
									className='flex-1'
									data-testid={`accept-${guest.id}`}
									onClick={() => setResponse(guest.id, 'accepted')}
									size='xl'
									variant={state.response === 'accepted' ? 'strong' : 'outline'}
								>
									{state.response === 'accepted' ? <Check data-icon='inline-start' /> : null}
									Ja
								</Button>
								<Button
									aria-pressed={state.response === 'declined'}
									className='flex-1'
									data-testid={`decline-${guest.id}`}
									onClick={() => setResponse(guest.id, 'declined')}
									size='xl'
									variant={state.response === 'declined' ? 'secondary' : 'outline'}
								>
									{state.response === 'declined' ? <X data-icon='inline-start' /> : null}
									Nein
								</Button>
							</div>
						</fieldset>

						{props.fields
							.filter((field) => field.scope === 'guest' && isFieldVisible(field, state.response))
							.map((field) => (
								<InvitationField
									field={field}
									key={field.id}
									onChange={(value) => setGuestAnswer(guest.id, field.id, value)}
									value={state.answers[field.id] ?? emptyValue(field)}
								/>
							))}
					</section>
				);
			})}

			{props.fields.some((field) => field.scope === 'invitation') ? (
				<section className='design-panel design-form p-6 sm:p-8' data-testid='invitation-fields'>
					{props.fields
						.filter((field) => field.scope === 'invitation')
						.map((field) => (
							<InvitationField
								field={field}
								key={field.id}
								onChange={(value) => setInvitationAnswer(field.id, value)}
								value={submission.answers[field.id] ?? emptyValue(field)}
							/>
						))}
				</section>
			) : null}

			<Button data-testid='submit-invitation' disabled={isSaving} onClick={save} size='xl' variant='strong'>
				{isSaving ? 'Wird gespeichert …' : 'Antwort speichern'}
			</Button>
		</div>
	);
}
