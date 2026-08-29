'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { ActionResult } from '@/lib/events/action-result';
import type { AnswerValue, FormFieldDefinition, GuestResponse, Submission } from '@/lib/events/form-schema';

import { InvitationField } from '@/components/events/invitation-field';
import { Button } from '@/components/ui/button';
import { formatBerlinShort } from '@/lib/events/berlin-time';
import { isFieldVisible } from '@/lib/events/form-schema';

export type InvitationFormGuest = {
	firstName: string;
	id: string;
	lastName: null | string;
	respondedAt: Date | null;
	response: GuestResponse;
};

type InvitationFormProps = {
	answers: { fieldId: string; guestId: null | string; value: AnswerValue }[];
	closedReason?: 'archived' | 'deadline-passed';
	fields: FormFieldDefinition[];
	guests: InvitationFormGuest[];
	onSubmit?: (submission: Submission) => Promise<ActionResult>;
};

const RESPONSE_WORDS = {
	accepted: 'Zugesagt',
	declined: 'Abgesagt',
	open: 'Noch offen',
} as const;

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
	const isClosed = Boolean(props.closedReason);
	const isPreview = !props.onSubmit;
	const disabled = isClosed || isPreview;

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

			return;
		}

		toast.error(result.message);
	};

	return (
		<div className='grid gap-6' data-testid='invitation-form'>
			{props.closedReason ? (
				<p className='design-panel px-4 py-3 text-sm' data-testid='invitation-closed-note'>
					{CLOSED_MESSAGES[props.closedReason]}
				</p>
			) : null}

			{props.guests.map((guest) => {
				const state = submission.guests[guest.id];

				if (!state) {
					return null;
				}

				return (
					<section
						className='design-panel grid gap-4 px-4 py-4'
						data-testid={`guest-${guest.id}`}
						key={guest.id}
					>
						<header className='grid gap-1'>
							<h2 className='text-lg font-bold'>{guestName(guest)}</h2>
							{guest.respondedAt ? (
								<p className='text-xs text-[var(--invitation-soft)]'>
									{RESPONSE_WORDS[state.response]} · zuletzt geändert am{' '}
									{formatBerlinShort(guest.respondedAt)}
								</p>
							) : null}
						</header>

						<fieldset className='flex gap-2'>
							<legend className='sr-only'>Antwort für {guestName(guest)}</legend>
							<Button
								aria-pressed={state.response === 'accepted'}
								className='flex-1'
								data-testid={`accept-${guest.id}`}
								disabled={disabled}
								onClick={() => setResponse(guest.id, 'accepted')}
								size='xl'
								variant={state.response === 'accepted' ? 'strong' : 'outline'}
							>
								{state.response === 'accepted' ? <Check data-icon='inline-start' /> : null}
								Ich komme
							</Button>
							<Button
								aria-pressed={state.response === 'declined'}
								className='flex-1'
								data-testid={`decline-${guest.id}`}
								disabled={disabled}
								onClick={() => setResponse(guest.id, 'declined')}
								size='xl'
								variant={state.response === 'declined' ? 'secondary' : 'outline'}
							>
								{state.response === 'declined' ? <X data-icon='inline-start' /> : null}
								Ich kann nicht
							</Button>
						</fieldset>

						{props.fields
							.filter((field) => field.scope === 'guest' && isFieldVisible(field, state.response))
							.map((field) => (
								<InvitationField
									disabled={disabled}
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
				<section className='design-panel grid gap-4 px-4 py-4' data-testid='invitation-fields'>
					{props.fields
						.filter((field) => field.scope === 'invitation')
						.map((field) => (
							<InvitationField
								disabled={disabled}
								field={field}
								key={field.id}
								onChange={(value) => setInvitationAnswer(field.id, value)}
								value={submission.answers[field.id] ?? emptyValue(field)}
							/>
						))}
				</section>
			) : null}

			{!disabled ? (
				<Button data-testid='submit-invitation' disabled={isSaving} onClick={save} size='xl' variant='strong'>
					{isSaving ? 'Wird gespeichert …' : 'Antwort speichern'}
				</Button>
			) : null}
		</div>
	);
}
