import { ChevronLeft, MapPin } from 'lucide-react';

import type { TSelectionState } from '@/features/mcp-app/view/use-events-app';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AppMessage } from '@/features/mcp-app/view/app-message';
import { formatEventDate } from '@/features/mcp-app/view/event-date';
import { InvitationRow } from '@/features/mcp-app/view/invitation-row';

type TInvitationListProps = {
	onBack: () => void;
	onDelete: (eventId: string, invitationId: string) => Promise<null | string>;
	state: TSelectionState;
};

function BackButton({ onBack }: { onBack: () => void }) {
	return (
		<Button className='justify-self-start' data-testid='back-to-events' onClick={onBack} size='sm' variant='ghost'>
			<ChevronLeft />
			Alle Events
		</Button>
	);
}

export function InvitationList({ onBack, onDelete, state }: TInvitationListProps) {
	if (state.kind === 'none') {
		return null;
	}

	if (state.kind === 'loading') {
		return (
			<section className='grid gap-4' data-testid='invitation-list-skeleton'>
				<BackButton onBack={onBack} />
				<Skeleton className='h-7 w-48 rounded-full' />
				{[0, 1, 2].map((row) => (
					<Skeleton className='h-16 rounded-2xl' key={row} />
				))}
			</section>
		);
	}

	if (state.kind === 'failed') {
		return (
			<section className='grid gap-4'>
				<BackButton onBack={onBack} />
				<AppMessage
					description={state.message}
					testId='invitation-list-error'
					title='Das Event konnte nicht geladen werden.'
					tone='danger'
				/>
			</section>
		);
	}

	const { event } = state;
	const date = formatEventDate(event.startsAt);

	return (
		<section className='grid gap-4' data-testid='invitation-list'>
			<BackButton onBack={onBack} />

			<header className='grid gap-1.5'>
				<h1 className='text-xl leading-tight font-bold text-ink'>{event.title}</h1>
				{date ? <p className='text-sm text-ink-soft'>{date}</p> : null}
				{event.location ? (
					<p className='flex items-center gap-1.5 text-sm text-ink-soft'>
						<MapPin aria-hidden='true' className='size-3.5' />
						{event.location}
					</p>
				) : null}
			</header>

			<h2 className='design-label'>Einladungen ({event.invitations.length})</h2>

			{event.invitations.length === 0 ? (
				<AppMessage
					description='Lege Einladungen an, dann stehen sie hier mit ihrem Antwortstand.'
					testId='invitation-list-empty'
					title='Noch keine Einladungen.'
				/>
			) : (
				<ul className='grid gap-2'>
					{event.invitations.map((invitation) => (
						<InvitationRow
							invitation={invitation}
							key={invitation.id}
							onDelete={() => onDelete(event.id, invitation.id)}
						/>
					))}
				</ul>
			)}
		</section>
	);
}
