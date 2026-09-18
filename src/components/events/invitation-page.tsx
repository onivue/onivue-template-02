'use client';

import { useState } from 'react';

import type { ActionResult } from '@/lib/events/action-result';
import type { AddressColumns } from '@/lib/events/event-location';
import type { EventNote } from '@/lib/events/event-note';
import type { AnswerValue, FormFieldDefinition, Submission } from '@/lib/events/form-schema';

import { EventCalendarRow } from '@/components/events/event-calendar-row';
import { EventDecoration } from '@/components/events/event-decoration';
import { EventLocationRow } from '@/components/events/event-location-row';
import { InvitationDeclinedNote } from '@/components/events/invitation-declined-note';
import { InvitationFacts } from '@/components/events/invitation-facts';
import {
	initialAnswerState,
	InvitationForm,
	type InvitationFormGuest,
	isAnswerReadOnly,
} from '@/components/events/invitation-form';
import { InvitationMood } from '@/components/events/invitation-mood';
import { InvitationNotes } from '@/components/events/invitation-notes';
import { Divided } from '@/components/layout/divided';
import { RichText } from '@/components/ui/rich-text';
import { invitationCalendarPath } from '@/config/routes';
import { isDecorationKey } from '@/lib/events/event-decoration';
import { hasAddress, toEventAddress } from '@/lib/events/event-location';
import { describeSchedule } from '@/lib/events/event-schedule';
import { resolveResponseMood } from '@/lib/events/response-mood';
import { parseRichText } from '@/lib/events/rich-text';

type InvitationPageProps = {
	answers: { fieldId: string; guestId: null | string; value: AnswerValue }[];
	closedReason?: 'archived' | 'deadline-passed';
	closesAt?: Date | null;
	event: AddressColumns & {
		decoration: null | string;
		endsAt: Date | null;
		greeting: null | string;
		notes: EventNote[];
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
	// one panel carries what somebody who is coming does next: save the date, find the way there.
	// with neither to show there is nothing to frame.
	const showsPlan = showsTiles && (!!schedule || hasAddress(address));
	// the background answers back the moment the reply is saved, and greets them with it on every
	// return — it is keyed off the saved answer, so an open form never gets one
	const mood = resolveResponseMood(answer);
	// the answer panel names the deadline in every state that can still be changed — a guest who
	// said no needs it most. only a shut window has nothing to promise; the panel says why instead.
	const deadline = props.closedReason ? null : props.closesAt;

	return (
		<div className='relative min-h-dvh bg-background px-4 py-10 text-foreground' data-testid='invitation-page'>
			{mood ? <InvitationMood mood={mood} /> : null}

			<div className='invitation-enter relative z-10 mx-auto grid w-full max-w-2xl gap-6'>
				<header className='grid justify-items-center gap-6 text-center'>
					{isDecorationKey(event.decoration) ? (
						<EventDecoration className='h-72 max-w-md sm:h-80' decoration={event.decoration} />
					) : null}

					{mood === 'declined' ? <InvitationDeclinedNote guestCount={props.guests.length} /> : null}

					<h1 className='design-page-title text-[clamp(2rem,6vw,3.25rem)]'>{event.title}</h1>

					<RichText className='max-w-prose text-base text-foreground' value={parseRichText(event.greeting)} />

					{showsTiles ? null : <InvitationFacts address={address} schedule={schedule} />}
				</header>

				{showsPlan ? (
					<Divided className='design-panel p-5 sm:p-6' data-testid='invitation-plan'>
						{schedule ? (
							<EventCalendarRow href={invitationCalendarPath(props.token)} schedule={schedule} />
						) : null}
						{hasAddress(address) ? <EventLocationRow address={address} /> : null}
					</Divided>
				) : null}

				<InvitationNotes notes={event.notes} />

				<InvitationForm
					answer={answer}
					answers={props.answers}
					closedReason={props.closedReason}
					closesAt={deadline}
					fields={props.fields}
					guests={props.guests}
					onAnswerChange={setAnswer}
					onSubmit={props.onSubmit}
				/>
			</div>
		</div>
	);
}
