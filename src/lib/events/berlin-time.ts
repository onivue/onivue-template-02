import { TZDate } from '@date-fns/tz';
import { endOfDay, format, isValid, parse, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

// every timestamp is stored in utc and read and written in one zone. the app is german, so the
// zone is fixed rather than offered as a setting — an admin and a guest must never disagree about
// when the deadline is.

export const EVENT_TIME_ZONE = 'Europe/Berlin';

const DATE_PATTERN = 'yyyy-MM-dd';
const INPUT_PATTERN = 'yyyy-MM-dd HH:mm';
const DISPLAY_PATTERN = "d. MMMM yyyy, HH:mm 'Uhr'";
const DATE_DISPLAY_PATTERN = 'd. MMMM yyyy';
// the invitation puts the day and the hour on two lines, so each gets its own pattern
const WEEKDAY_DISPLAY_PATTERN = 'EEEE, d. MMMM yyyy';
const TIME_DISPLAY_PATTERN = "HH:mm 'Uhr'";
const SHORT_PATTERN = 'dd.MM.yyyy, HH:mm';
const SHORT_DATE_PATTERN = 'dd.MM.yyyy';

// a value may name a day without a time. which moment of that day it means depends on the field:
// a beginning is its first, a deadline its last — otherwise "Frist: 15. Juli" would lock guests
// out for the whole of the 15th.
export type TimelessMoment = 'end-of-day' | 'start-of-day';

function berlinNow(): TZDate {
	return new TZDate(Date.now(), EVENT_TIME_ZONE);
}

// minute granularity is all the picker offers, so neither of these can be typed by hand and both
// read back as "no time given"
function isTimeless(date: TZDate, moment: TimelessMoment): boolean {
	const marker = moment === 'end-of-day' ? endOfDay(date) : startOfDay(date);

	return date.getTime() === marker.getTime();
}

export function parseBerlinDateTime(
	value: null | string | undefined,
	moment: TimelessMoment = 'start-of-day'
): Date | null {
	if (!value) {
		return null;
	}

	const normalized = value.replace('T', ' ');

	if (normalized.length <= DATE_PATTERN.length) {
		const day = parse(normalized, DATE_PATTERN, berlinNow());

		if (!isValid(day)) {
			return null;
		}

		return new Date((moment === 'end-of-day' ? endOfDay(day) : startOfDay(day)).getTime());
	}

	const parsed = parse(normalized.slice(0, INPUT_PATTERN.length), INPUT_PATTERN, berlinNow());

	if (!isValid(parsed)) {
		return null;
	}

	return new Date(parsed.getTime());
}

// the reverse: fills the picker without dragging the browser's own zone into it
export function toBerlinInputValue(date: Date | null, moment: TimelessMoment = 'start-of-day'): string {
	if (!date) {
		return '';
	}

	const zoned = new TZDate(date, EVENT_TIME_ZONE);

	if (isTimeless(zoned, moment)) {
		return format(zoned, DATE_PATTERN);
	}

	return format(zoned, "yyyy-MM-dd'T'HH:mm");
}

export function formatBerlin(date: Date | null, moment: TimelessMoment = 'start-of-day'): string {
	if (!date) {
		return '';
	}

	const zoned = new TZDate(date, EVENT_TIME_ZONE);

	return format(zoned, isTimeless(zoned, moment) ? DATE_DISPLAY_PATTERN : DISPLAY_PATTERN, { locale: de });
}

// "Samstag, 24. Oktober 2026" — the weekday is what a guest checks first
export function formatBerlinWeekday(date: Date | null): string {
	if (!date) {
		return '';
	}

	return format(new TZDate(date, EVENT_TIME_ZONE), WEEKDAY_DISPLAY_PATTERN, { locale: de });
}

// "19:30 Uhr", or empty for a day that was given without an hour
export function formatBerlinTime(date: Date | null, moment: TimelessMoment = 'start-of-day'): string {
	if (!date) {
		return '';
	}

	const zoned = new TZDate(date, EVENT_TIME_ZONE);

	return isTimeless(zoned, moment) ? '' : format(zoned, TIME_DISPLAY_PATTERN, { locale: de });
}

export function formatBerlinShort(date: Date | null, moment: TimelessMoment = 'start-of-day'): string {
	if (!date) {
		return '';
	}

	const zoned = new TZDate(date, EVENT_TIME_ZONE);

	return format(zoned, isTimeless(zoned, moment) ? SHORT_DATE_PATTERN : SHORT_PATTERN);
}
