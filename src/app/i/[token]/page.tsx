import type { Metadata } from 'next';

import { Suspense } from 'react';

import type { Submission } from '@/lib/events/form-schema';

import { InvitationPage } from '@/components/events/invitation-page';
import { InvitationViewTracker } from '@/components/events/invitation-view-tracker';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
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

// a guest opens this link cold on a phone, so the frame is on screen before the lookup returns
function InvitationSkeleton() {
	return (
		<div className='min-h-dvh bg-background px-4 py-10 text-foreground' data-testid='invitation-loading'>
			<div className='mx-auto grid w-full max-w-2xl gap-6'>
				<Skeleton className='mx-auto h-72 w-full max-w-md rounded-3xl sm:h-80' />
				<CardSkeleton className='h-72' />
			</div>
		</div>
	);
}

async function GuestInvitation({ params }: InvitationPageProps) {
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
		<>
			<InvitationPage
				answers={view.answers}
				closedReason={window.open ? undefined : window.reason}
				closesAt={window.open ? window.closesAt : null}
				event={view.event}
				fields={view.fields}
				guests={view.guests}
				onSubmit={window.open ? submit : undefined}
			/>
			<InvitationViewTracker token={token} />
		</>
	);
}

export default function GuestInvitationPage({ params }: InvitationPageProps) {
	return (
		<Suspense fallback={<InvitationSkeleton />}>
			<GuestInvitation params={params} />
		</Suspense>
	);
}
