'use client';

import { useState } from 'react';

import type { ActionResult } from '@/lib/events/action-result';
import type { AddressColumns } from '@/lib/events/event-location';
import type { AnswerValue, FormFieldDefinition, Submission } from '@/lib/events/form-schema';

import { EventCalendarCard } from '@/components/events/event-calendar-card';
import { EventDecoration } from '@/components/events/event-decoration';
import { EventLocationCard } from '@/components/events/event-location-card';
import { InvitationFacts } from '@/components/events/invitation-facts';
import {
	initialAnswerState,
	InvitationForm,
	type InvitationFormGuest,
	isAnswerReadOnly,
} from '@/components/events/invitation-form';
import { invitationCalendarPath } from '@/config/routes';
import { formatBerlin } from '@/lib/events/berlin-time';
import { isDecorationKey } from '@/lib/events/event-decoration';
import { toEventAddress } from '@/lib/events/event-location';
import { describeSchedule } from '@/lib/events/event-schedule';

type InvitationPageProps = {
	answers: { fieldId: string; guestId: null | string; value: AnswerValue }[];
	closedReason?: 'archived' | 'deadline-passed';
	closesAt?: Date | null;
	event: AddressColumns & {
		decoration: null | string;
		endsAt: Date | null;
		greeting: null | string;
		startsAt: Date | null;
		title: string;
	};
	fields: FormFieldDefinition[];
	guests: InvitationFormGuest[];
	onSubmit?: (submission: Submission) => Promise<ActionResult>;
	token: string;
};

// the whole guest-facing page. there is a single design — the app's own — so nothing here reads a
// per-event theme.
export function InvitationPage(props: InvitationPageProps) {
	const { event } = props;
	const [answer, setAnswer] = useState(() => initialAnswerState(props.guests));
	const address = toEventAddress(event);
	const schedule = describeSchedule(event.startsAt, event.endsAt);
	// the two tiles say the date and the address in full, so the bare facts above would only repeat
	// them — whichever is on screen, it is never both
	const showsTiles =
		(isAnswerReadOnly(props.closedReason, props.onSubmit) || answer.isAnswered) && answer.isAttending;

	return (
		<div className='min-h-dvh bg-background px-4 py-10 text-foreground' data-testid='invitation-page'>
			<div className='mx-auto grid w-full max-w-2xl gap-6'>
				<header className='grid justify-items-center gap-6 text-center'>
					{isDecorationKey(event.decoration) ? (
						<EventDecoration className='h-72 max-w-md sm:h-80' decoration={event.decoration} />
					) : null}

					<h1 className='design-page-title text-[clamp(2rem,6vw,3.25rem)]'>{event.title}</h1>

					{event.greeting ? (
						<p className='max-w-prose text-base whitespace-pre-line text-foreground'>{event.greeting}</p>
					) : null}

					{showsTiles ? null : <InvitationFacts address={address} schedule={schedule} />}
				</header>

				{showsTiles ? (
					<div className='grid gap-4'>
						<EventCalendarCard href={invitationCalendarPath(props.token)} schedule={schedule} />
						<EventLocationCard address={address} />
					</div>
				) : null}

				{props.closesAt && !props.closedReason ? (
					<p
						className='rounded grid justify-items-center gap-1.5 text-center text-xs text-ink-soft'
						data-testid='invitation-deadline'
					>
						Antwort bitte bis {formatBerlin(props.closesAt, 'end-of-day')}. Du kannst sie bis dahin
						jederzeit ändern.
					</p>
				) : null}

				<InvitationForm
					answer={answer}
					answers={props.answers}
					closedReason={props.closedReason}
					fields={props.fields}
					guests={props.guests}
					onAnswerChange={setAnswer}
					onSubmit={props.onSubmit}
				/>
			</div>
		</div>
	);
}
