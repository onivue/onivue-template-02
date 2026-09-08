import { formatBerlin } from '@/lib/events/berlin-time';

const SEPARATOR = ' · ';
const MAX_LENGTH = 200;
const ELLIPSIS = '…';
const FALLBACK = 'Du bist eingeladen. Öffne den Link, um zu- oder abzusagen.';

export type InvitationPreviewEvent = {
	greeting: null | string;
	location: null | string;
	startsAt: Date | null;
};

// an address runs over several lines; a preview gets one
function firstLine(value: string): string {
	return value.split('\n')[0]?.trim() ?? '';
}

function shorten(value: string): string {
	return value.length > MAX_LENGTH ? `${value.slice(0, MAX_LENGTH - 1).trimEnd()}${ELLIPSIS}` : value;
}

// the line a messenger prints under the event title. when and where answer the guest's first
// question, so they come before the host's own words.
export function invitationPreviewDescription(event: InvitationPreviewEvent): string {
	const facts = [event.startsAt ? formatBerlin(event.startsAt) : '', event.location ? firstLine(event.location) : '']
		.filter(Boolean)
		.join(SEPARATOR);

	if (facts) {
		return shorten(facts);
	}

	const greeting = event.greeting ? firstLine(event.greeting) : '';

	return greeting ? shorten(greeting) : FALLBACK;
}
