import { toIcs, toIcsFilename } from '@/lib/events/calendar-export';
import { loadInvitationPage } from '@/lib/events/invitation-page-data';

// the guest-facing download. goes through the same cached, rate-limited lookup as the invitation
// page itself, so a token guess costs the same here as it does there.
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }): Promise<Response> {
	const { token } = await context.params;
	const state = await loadInvitationPage(token);

	if (state.status !== 'available') {
		return new Response('Not found', { status: 404 });
	}

	const { event } = state.view;
	const ics = toIcs({ event, now: new Date(), uid: `${state.view.invitationId}@event.onivue` });

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
