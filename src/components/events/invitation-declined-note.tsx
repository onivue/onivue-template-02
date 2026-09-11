'use client';

import { HeartCrack } from 'lucide-react';

import { formatBerlin } from '@/lib/events/berlin-time';

type InvitationDeclinedNoteProps = {
	closesAt?: Date | null;
	guestCount: number;
};

// what a guest who is not coming gets instead of the calendar and the way there: one warm line
// saying they will be missed, and — while the window is still open — a reminder that "not coming"
// is not final. closesAt only ever arrives here when the window is still open (see the invitation
// route), so its presence alone decides whether that second line renders.
export function InvitationDeclinedNote({ closesAt, guestCount }: InvitationDeclinedNoteProps) {
	const isGroup = guestCount > 1;

	return (
		<section
			className='design-panel flex w-full items-center gap-4 border-destructive/35 bg-destructive/10 p-5 text-left sm:p-6'
			data-testid='invitation-declined-note'
		>
			<span className='grid size-11 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-destructive'>
				<HeartCrack aria-hidden='true' className='size-5' />
			</span>

			<div className='grid gap-1'>
				<h2 className='text-lg font-bold text-destructive'>
					{isGroup ? 'Schade, dass ihr nicht kommt!' : 'Schade, dass du nicht kommst!'}
				</h2>
				<p className='text-sm text-destructive/85'>
					{isGroup ? 'Wir hätten euch gern dabei gehabt.' : 'Wir hätten dich gern dabei gehabt.'}
					{closesAt
						? ` Du kannst deine Antwort bis ${formatBerlin(closesAt, 'end-of-day')} noch ändern.`
						: null}
				</p>
			</div>
		</section>
	);
}
