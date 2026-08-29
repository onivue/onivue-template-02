import type { Metadata } from 'next';

import { Caveat, Playfair_Display } from 'next/font/google';

import type { Submission } from '@/lib/events/form-schema';

import { InvitationPage } from '@/components/events/invitation-page';
import { invitationRepository } from '@/lib/events/event-services';
import { checkGuestPageLimit, submitInvitationResponse } from '@/lib/events/guest-actions';
import { resolveHeaderImageUrl } from '@/lib/events/header-image';
import { resolveResponseWindow } from '@/lib/events/response-window';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-invitation-serif' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-invitation-script' });

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

	const headerImageUrl = await resolveHeaderImageUrl(view.event.themeHeaderImageKey);

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
		<div className={`${playfair.variable} ${caveat.variable}`}>
			<InvitationPage
				answers={view.answers}
				closedReason={window.open ? undefined : window.reason}
				closesAt={window.open ? window.closesAt : null}
				event={view.event}
				fields={view.fields}
				guests={view.guests}
				headerImageUrl={headerImageUrl}
				onSubmit={window.open ? submit : undefined}
				theme={{
					themeAccent: view.event.themeAccent,
					themeFont: view.event.themeFont,
					themeHeaderImageKey: view.event.themeHeaderImageKey,
					themeMode: view.event.themeMode,
				}}
			/>
		</div>
	);
}
