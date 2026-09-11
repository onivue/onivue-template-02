import type { AddressColumns } from '@/lib/events/event-location';

import { formatBerlin } from '@/lib/events/berlin-time';
import { addressSingleLine, toEventAddress } from '@/lib/events/event-location';

const SEPARATOR = ' · ';
const MAX_LENGTH = 200;
const ELLIPSIS = '…';
const FALLBACK = 'Du bist eingeladen. Öffne den Link, um zu- oder abzusagen.';

export type InvitationPreviewEvent = AddressColumns & {
	greeting: null | string;
	startsAt: Date | null;
};

// a greeting runs over several lines; a preview gets one
function firstLine(value: string): string {
	return value.split('\n')[0]?.trim() ?? '';
}

function shorten(value: string): string {
	return value.length > MAX_LENGTH ? `${value.slice(0, MAX_LENGTH - 1).trimEnd()}${ELLIPSIS}` : value;
}

// the line a messenger prints under the event title. when and where answer the guest's first
// question, so they come before the host's own words.
export function invitationPreviewDescription(event: InvitationPreviewEvent): string {
	const facts = [event.startsAt ? formatBerlin(event.startsAt) : '', addressSingleLine(toEventAddress(event)) ?? '']
		.filter(Boolean)
		.join(SEPARATOR);

	if (facts) {
		return shorten(facts);
	}

	const greeting = event.greeting ? firstLine(event.greeting) : '';

	return greeting ? shorten(greeting) : FALLBACK;
}
