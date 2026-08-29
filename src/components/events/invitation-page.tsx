'use client';

import type { ActionResult } from '@/lib/events/action-result';
import type { EventTheme } from '@/lib/events/event-theme';
import type { AnswerValue, FormFieldDefinition, Submission } from '@/lib/events/form-schema';

import { InvitationForm, type InvitationFormGuest } from '@/components/events/invitation-form';
import { formatBerlin } from '@/lib/events/berlin-time';
import { toThemeStyle } from '@/lib/events/event-theme';

type InvitationPageProps = {
	answers: { fieldId: string; guestId: null | string; value: AnswerValue }[];
	closedReason?: 'archived' | 'deadline-passed';
	closesAt?: Date | null;
	event: {
		endsAt: Date | null;
		greeting: null | string;
		location: null | string;
		startsAt: Date | null;
		title: string;
	};
	fields: FormFieldDefinition[];
	guests: InvitationFormGuest[];
	headerImageUrl?: null | string;
	onSubmit?: (submission: Submission) => Promise<ActionResult>;
	theme: EventTheme;
};

// the whole guest-facing page, theme included. the design tab renders exactly this component with
// the draft theme, so the preview cannot drift from the real thing.
export function InvitationPage(props: InvitationPageProps) {
	const { event } = props;

	return (
		<div
			className='min-h-dvh bg-[var(--invitation-background)] px-4 py-10 font-[family-name:var(--invitation-font)] text-[var(--invitation-text)]'
			data-testid='invitation-page'
			style={toThemeStyle(props.theme)}
		>
			<div className='mx-auto grid w-full max-w-2xl gap-6'>
				{props.headerImageUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						alt=''
						className='h-48 w-full rounded-3xl object-cover'
						data-testid='invitation-header-image'
						src={props.headerImageUrl}
					/>
				) : null}

				<header className='grid gap-3 text-center'>
					<h1 className='text-[clamp(2rem,6vw,3.25rem)] leading-tight font-bold'>{event.title}</h1>
					<div className='grid gap-1 text-sm text-[var(--invitation-soft)]'>
						{event.startsAt ? (
							<p data-testid='invitation-when'>
								{formatBerlin(event.startsAt)}
								{event.endsAt ? ` – ${formatBerlin(event.endsAt)}` : ''}
							</p>
						) : null}
						{event.location ? <p data-testid='invitation-where'>{event.location}</p> : null}
					</div>
					{event.greeting ? <p className='text-base whitespace-pre-line'>{event.greeting}</p> : null}
				</header>

				{props.closesAt && !props.closedReason ? (
					<p className='text-center text-xs text-[var(--invitation-soft)]' data-testid='invitation-deadline'>
						Antwort bitte bis {formatBerlin(props.closesAt)}. Du kannst sie bis dahin jederzeit ändern.
					</p>
				) : null}

				<div
					className='[&_.design-panel]:border-[var(--invitation-border)] [&_.design-panel]:bg-[var(--invitation-panel)] [&_.design-panel]:shadow-none'
					style={{
						['--action-strong' as string]: 'var(--invitation-accent)',
						['--action-strong-foreground' as string]: 'var(--invitation-accent-foreground)',
					}}
				>
					<InvitationForm
						answers={props.answers}
						closedReason={props.closedReason}
						fields={props.fields}
						guests={props.guests}
						onSubmit={props.onSubmit}
					/>
				</div>
			</div>
		</div>
	);
}
