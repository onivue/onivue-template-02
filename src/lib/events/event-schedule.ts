import { formatBerlin, formatBerlinTime, formatBerlinWeekday } from '@/lib/events/berlin-time';

// when the event is, in the two or three lines the invitation shows. one place decides how a missing
// end, a same-day end and an end after midnight each read, rather than every surface guessing again.

export type EventSchedule = {
	date: string;
	// null for a day that was given without an hour
	time: null | string;
	// only set when the event runs past midnight, where an end time alone would be misleading
	until: null | string;
};

const RANGE_SEPARATOR = ' – ';
const TIME_SUFFIX = ' Uhr';
const OPEN_END_PREFIX = 'ab ';
const UNTIL_PREFIX = 'bis ';

function isSameDay(start: Date, end: Date): boolean {
	return formatBerlinWeekday(start) === formatBerlinWeekday(end);
}

export function describeSchedule(startsAt: Date | null, endsAt: Date | null): EventSchedule | null {
	if (!startsAt) {
		return null;
	}

	const date = formatBerlinWeekday(startsAt);
	const startTime = formatBerlinTime(startsAt);

	if (!startTime) {
		return { date, time: null, until: null };
	}

	const endTime = endsAt ? formatBerlinTime(endsAt) : '';

	if (endsAt && endTime && isSameDay(startsAt, endsAt)) {
		// "19:30 – 23:00 Uhr": the unit is said once, at the end of the range
		return { date, time: `${startTime.replace(TIME_SUFFIX, '')}${RANGE_SEPARATOR}${endTime}`, until: null };
	}

	return {
		date,
		time: `${OPEN_END_PREFIX}${startTime}`,
		until: endsAt ? `${UNTIL_PREFIX}${formatBerlin(endsAt)}` : null,
	};
}
