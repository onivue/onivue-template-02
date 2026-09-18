'use client';

import { HeartCrack } from 'lucide-react';

type InvitationDeclinedNoteProps = {
	guestCount: number;
};

// what a guest who is not coming gets instead of the calendar and the way there: one warm line
// saying they will be missed. that "not coming" is not final is said once, by the answer panel
// below, which is where the button that changes it sits — saying it twice on one screen reads as
// pleading.
export function InvitationDeclinedNote({ guestCount }: InvitationDeclinedNoteProps) {
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
				</p>
			</div>
		</section>
	);
}
