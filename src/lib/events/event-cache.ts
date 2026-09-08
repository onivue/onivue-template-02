// the names that connect a cached read to the mutation that makes it stale. they live here rather
// than as literals at both ends, so a new action cannot invent a tag no reader ever used.

export function eventDetailsTag(eventId: string): string {
	return `event:${eventId}:details`;
}

// the guest list, and with it every count derived from it
export function eventGuestsTag(eventId: string): string {
	return `event:${eventId}:guests`;
}

export function eventFormTag(eventId: string): string {
	return `event:${eventId}:form`;
}

// the list of an organization's events, including the counts on each card
export function eventListTag(organizationId: string): string {
	return `events:${organizationId}`;
}
