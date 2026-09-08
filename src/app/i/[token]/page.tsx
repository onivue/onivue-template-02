import type { Metadata, ResolvingMetadata } from 'next';

import { Suspense } from 'react';

import type { Submission } from '@/lib/events/form-schema';

import { InvitationPage } from '@/components/events/invitation-page';
import { InvitationViewTracker } from '@/components/events/invitation-view-tracker';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { submitInvitationResponse } from '@/lib/events/guest-actions';
import { loadInvitationPage } from '@/lib/events/invitation-page-data';
import { invitationPreviewDescription } from '@/lib/events/invitation-preview';
import { resolveResponseWindow } from '@/lib/events/response-window';

type InvitationPageProps = {
	params: Promise<{ token: string }>;
};

// a token in a search result would be a leaked invitation. a messenger preview is a different
// matter: it is shown to the person the host just sent the link to, and it reveals nothing that
// opening the link would not.
const NEVER_INDEX = { follow: false, index: false } as const;

export async function generateMetadata({ params }: InvitationPageProps, parent: ResolvingMetadata): Promise<Metadata> {
	const { token } = await params;
	const state = await loadInvitationPage(token);

	// an unknown token, a replaced one and a deleted event read the same here as they do on the page
	if (state.status !== 'available') {
		return { robots: NEVER_INDEX, title: 'Einladung' };
	}

	const { event } = state.view;
	const description = invitationPreviewDescription(event);
	// an openGraph object replaces the parent's rather than merging into it, so the site name, the
	// locale and the preview image have to be carried over or the card arrives with no picture
	const inherited = (await parent).openGraph;

	return {
		description,
		openGraph: {
			images: inherited?.images,
			locale: inherited?.locale ?? undefined,
			siteName: inherited?.siteName ?? undefined,
			description,
			title: event.title,
			type: 'website',
		},
		robots: NEVER_INDEX,
		title: event.title,
	};
}

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
	const state = await loadInvitationPage(token);

	if (state.status === 'rate-limited') {
		return <Notice>Zu viele Aufrufe in kurzer Zeit. Bitte versuche es gleich noch einmal.</Notice>;
	}

	// an unknown token, a replaced one and a deleted event all end here, saying the same thing:
	// nobody learns from this page whether an invitation ever existed
	if (state.status === 'unavailable') {
		return <Notice>Diese Einladung ist nicht verfügbar.</Notice>;
	}

	const { view } = state;

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
