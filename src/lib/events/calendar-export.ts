import { slugifyEventTitle } from '@/lib/events/filename-slug';

// the "im Kalender speichern" feature: one vevent per event, since an invitation never covers more
// than the one occasion it was sent for. rfc 5545, kept to the fields every calendar app reads.

const CRLF = '\r\n';
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export type CalendarExportEvent = {
	endsAt: Date | null;
	greeting: null | string;
	location: null | string;
	startsAt: Date | null;
	title: string;
};

export type IcsInput = {
	event: CalendarExportEvent;
	now: Date;
	uid: string;
};

function escapeText(value: string): string {
	return value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');
}

function toUtcStamp(date: Date): string {
	return date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');
}

// no end was set: an hour is the shortest span every calendar app still renders as a real block
// rather than folding it into an all-day marker
function resolveEnd(startsAt: Date, endsAt: Date | null): Date {
	return endsAt ?? new Date(startsAt.getTime() + DEFAULT_DURATION_MS);
}

// null when the event has no date yet — there is nothing to save
export function toIcs(input: IcsInput): string | null {
	const { event, now, uid } = input;

	if (!event.startsAt) {
		return null;
	}

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//event.onivue//event export//DE',
		'CALSCALE:GREGORIAN',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${toUtcStamp(now)}`,
		`DTSTART:${toUtcStamp(event.startsAt)}`,
		`DTEND:${toUtcStamp(resolveEnd(event.startsAt, event.endsAt))}`,
		`SUMMARY:${escapeText(event.title)}`,
		...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
		...(event.greeting ? [`DESCRIPTION:${escapeText(event.greeting)}`] : []),
		'END:VEVENT',
		'END:VCALENDAR',
	];

	return lines.join(CRLF) + CRLF;
}

export function toIcsFilename(title: string): string {
	return `${slugifyEventTitle(title)}.ics`;
}
