import type { Metadata } from 'next';

import type { Submission } from '@/lib/events/form-schema';

import { InvitationPage } from '@/components/events/invitation-page';
import { invitationRepository } from '@/lib/events/event-services';
import { checkGuestPageLimit, submitInvitationResponse } from '@/lib/events/guest-actions';
import { resolveResponseWindow } from '@/lib/events/response-window';

type InvitationPageProps = {
	params: Promise<{ token: string }>;
};

// a token in a search result would be a leaked invitation
export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Einladung',
};

function Notice({ children }: { children: React.ReactNode }) {
	return (
		<main className='grid min-h-dvh place-items-center px-6' data-testid='invitation-unavailable'>
			<p className='max-w-md text-center text-lg text-ink-soft'>{children}</p>
		</main>
	);
}

export default async function GuestInvitationPage({ params }: InvitationPageProps) {
	const { token } = await params;

	if (!(await checkGuestPageLimit())) {
		return <Notice>Zu viele Aufrufe in kurzer Zeit. Bitte versuche es gleich noch einmal.</Notice>;
	}

	const view = await invitationRepository.findByToken(token);

	// an unknown token, a replaced one and a deleted event all end here, saying the same thing:
	// nobody learns from this page whether an invitation ever existed
	if (!view) {
		return <Notice>Diese Einladung ist nicht verfügbar.</Notice>;
	}

	const window = resolveResponseWindow(
		{
			eventDeadline: view.event.responseDeadline,
			eventStatus: view.event.status,
			invitationDeadline: view.responseDeadline,
		},
		new Date()
	);

	async function submit(submission: Submission) {
		'use server';

		return await submitInvitationResponse(token, submission);
	}

	return (
		<InvitationPage
			answers={view.answers}
			closedReason={window.open ? undefined : window.reason}
			closesAt={window.open ? window.closesAt : null}
			event={view.event}
			fields={view.fields}
			guests={view.guests}
			onSubmit={window.open ? submit : undefined}
		/>
	);
}
