import { BulkInviteForm } from '@/components/events/bulk-invite-form';
import { GuestTable } from '@/components/events/guest-table';
import { ResponseCounts } from '@/components/events/response-counts';
import { loadEvent } from '@/lib/events/event-page-data';
import { eventRepository } from '@/lib/events/event-services';

type GuestsPageProps = {
	params: Promise<{ eventId: string }>;
};

export default async function EventGuestsPage({ params }: GuestsPageProps) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);
	const [invitations, counts] = await Promise.all([
		eventRepository.listInvitations(event.id),
		eventRepository.eventCounts(event.id),
	]);

	return (
		<div className='grid gap-5' data-testid='event-guests'>
			<ResponseCounts counts={counts} />
			<BulkInviteForm eventId={event.id} />
			<GuestTable eventId={event.id} invitations={invitations} />
		</div>
	);
}
