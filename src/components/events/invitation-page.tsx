'use client';

import { CalendarDays, Map, MapPin } from 'lucide-react';

import type { ActionResult } from '@/lib/events/action-result';
import type { AnswerValue, FormFieldDefinition, Submission } from '@/lib/events/form-schema';

import { EventDecoration } from '@/components/events/event-decoration';
import { InvitationForm, type InvitationFormGuest } from '@/components/events/invitation-form';
import { formatBerlin } from '@/lib/events/berlin-time';
import { isDecorationKey } from '@/lib/events/event-decoration';

type InvitationPageProps = {
	answers: { fieldId: string; guestId: null | string; value: AnswerValue }[];
	closedReason?: 'archived' | 'deadline-passed';
	closesAt?: Date | null;
	event: {
		decoration: null | string;
		endsAt: Date | null;
		greeting: null | string;
		location: null | string;
		locationAppleMapsUrl: null | string;
		locationGoogleMapsUrl: null | string;
		startsAt: Date | null;
		title: string;
	};
	fields: FormFieldDefinition[];
	guests: InvitationFormGuest[];
	onSubmit?: (submission: Submission) => Promise<ActionResult>;
};

function MapLink({
	children,
	href,
	icon: Icon,
	testId,
}: {
	children: React.ReactNode;
	href: string;
	icon: typeof MapPin;
	testId: string;
}) {
	return (
		<a
			className='inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted'
			data-testid={testId}
			href={href}
			rel='noopener noreferrer'
			target='_blank'
		>
			<Icon aria-hidden='true' className='size-3.5' />
			{children}
		</a>
	);
}

// the whole guest-facing page. there is a single design — the app's own — so nothing here reads a
// per-event theme.
export function InvitationPage(props: InvitationPageProps) {
	const { event } = props;

	return (
		<div className='min-h-dvh bg-background px-4 py-10 text-foreground' data-testid='invitation-page'>
			<div className='mx-auto grid w-full max-w-2xl gap-6'>
				<header className='grid justify-items-center gap-4 text-center'>
					{isDecorationKey(event.decoration) ? (
						<EventDecoration className='h-72 max-w-md sm:h-80' decoration={event.decoration} />
					) : null}

					<h1 className='design-page-title text-[clamp(2rem,6vw,3.25rem)]'>{event.title}</h1>

					<div className='grid justify-items-center gap-2 text-sm text-ink-soft'>
						{event.startsAt ? (
							<p className='flex items-center gap-2' data-testid='invitation-when'>
								<CalendarDays aria-hidden='true' className='size-4 shrink-0' />
								<span>
									{formatBerlin(event.startsAt)}
									{event.endsAt ? ` – ${formatBerlin(event.endsAt)}` : ''}
								</span>
							</p>
						) : null}

						{event.location ? (
							<p className='flex items-start gap-2' data-testid='invitation-where'>
								<MapPin aria-hidden='true' className='mt-0.5 size-4 shrink-0' />
								<span className='whitespace-pre-line'>{event.location}</span>
							</p>
						) : null}

						{event.locationAppleMapsUrl || event.locationGoogleMapsUrl ? (
							<div className='mt-1 flex flex-wrap justify-center gap-2'>
								{event.locationAppleMapsUrl ? (
									<MapLink
										href={event.locationAppleMapsUrl}
										icon={MapPin}
										testId='invitation-where-apple-maps'
									>
										Apple Karten
									</MapLink>
								) : null}
								{event.locationGoogleMapsUrl ? (
									<MapLink
										href={event.locationGoogleMapsUrl}
										icon={Map}
										testId='invitation-where-google-maps'
									>
										Google Maps
									</MapLink>
								) : null}
							</div>
						) : null}
					</div>

					{event.greeting ? (
						<p className='max-w-prose text-base whitespace-pre-line text-foreground'>{event.greeting}</p>
					) : null}
				</header>

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
					answers={props.answers}
					closedReason={props.closedReason}
					fields={props.fields}
					guests={props.guests}
					onSubmit={props.onSubmit}
				/>
			</div>
		</div>
	);
}
