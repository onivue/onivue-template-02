import { getActiveMembership } from '@/lib/auth/active-organization';
import { toIcs, toIcsFilename } from '@/lib/events/calendar-export';
import { eventRepository } from '@/lib/events/event-services';

// a download needs a real response, which a server action cannot give — same reasoning as the csv
// export route. findEvent is already organization-scoped, so no separate access check is needed.
export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }): Promise<Response> {
	const { eventId } = await context.params;
	const membership = await getActiveMembership();
	const event = await eventRepository.findEvent(eventId, membership.organizationId);

	if (!event) {
		return new Response('Not found', { status: 404 });
	}

	const ics = toIcs({ event, now: new Date(), uid: `${event.id}@event.onivue` });

	if (!ics) {
		return new Response('Kein Termin festgelegt.', { status: 409 });
	}

	return new Response(ics, {
		headers: {
			'Cache-Control': 'no-store',
			'Content-Disposition': `attachment; filename="${toIcsFilename(event.title)}"`,
			'Content-Type': 'text/calendar; charset=utf-8',
		},
	});
}
