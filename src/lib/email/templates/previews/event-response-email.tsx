import { EventResponseEmail } from '@/lib/email/templates/event-response-email';

export default function EventResponseEmailPreview() {
	return (
		<EventResponseEmail
			answers={[
				{ label: 'Wie reist ihr an?', value: 'Mit dem Zug' },
				{ label: 'Übernachtung nötig?', value: 'Ja, eine Nacht' },
			]}
			eventTitle='Hochzeit von Anna und Ben'
			eventUrl='https://onivue.app/events/preview-event'
			guests={[
				{
					answers: [
						{ label: 'Menüwunsch', value: 'Vegetarisch' },
						{ label: 'Allergien', value: 'Nüsse, Sellerie' },
					],
					name: 'Robin Meier',
					status: 'accepted',
				},
				{ answers: [{ label: 'Menüwunsch', value: 'Fisch' }], name: 'Hannah Meier', status: 'accepted' },
				{ answers: [], name: 'Oma Meier', status: 'declined' },
			]}
			invitationLabel='Robin Meier & Hannah Meier & Oma Meier'
		/>
	);
}
