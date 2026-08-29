import { getActiveMembership } from '@/lib/auth/active-organization';
import { formatBerlinShort } from '@/lib/events/berlin-time';
import { toCsv, toCsvFilename } from '@/lib/events/csv-export';
import { eventAccess, eventRepository } from '@/lib/events/event-services';

// a download needs a real response, which a server action cannot give — so the export is the one
// route handler in this feature. it repeats the access check rather than trusting the referrer.
export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }): Promise<Response> {
	const { eventId } = await context.params;
	const membership = await getActiveMembership();
	const access = await eventAccess.forManaging(eventId, membership);

	if (!access.success) {
		return new Response('Not found', { status: 404 });
	}

	const [invitations, fields, answers] = await Promise.all([
		eventRepository.listInvitations(eventId),
		// retired fields are part of the export: their answers are still real answers
		eventRepository.listFormFields(eventId, true),
		eventRepository.listAnswers(eventId),
	]);

	const csv = toCsv({
		answers,
		fields,
		formatDate: formatBerlinShort,
		invitations,
	});

	return new Response(csv, {
		headers: {
			'Cache-Control': 'no-store',
			'Content-Disposition': `attachment; filename="${toCsvFilename(access.data.title)}"`,
			'Content-Type': 'text/csv; charset=utf-8',
		},
	});
}
