import { AppMessage } from '@/features/mcp-app/view/app-message';
import { EventList } from '@/features/mcp-app/view/event-list';
import { InvitationList } from '@/features/mcp-app/view/invitation-list';
import { useEventsApp } from '@/features/mcp-app/view/use-events-app';

// two screens, never both: the events, or the invitations of the one that is open.
export function EventsApp() {
	const { closeEvent, connectionError, deleteInvitation, events, openEvent, reloadEvents, selection } =
		useEventsApp();

	if (connectionError) {
		return (
			<main className='p-4'>
				<AppMessage
					description={connectionError.message}
					testId='connection-error'
					title='Keine Verbindung zum Host.'
					tone='danger'
				/>
			</main>
		);
	}

	return (
		<main className='p-4' data-testid='mcp-app'>
			{selection.kind === 'none' ? (
				<EventList onOpen={openEvent} onReload={reloadEvents} state={events} />
			) : (
				<InvitationList onBack={closeEvent} onDelete={deleteInvitation} state={selection} />
			)}
		</main>
	);
}
