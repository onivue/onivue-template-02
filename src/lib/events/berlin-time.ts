import { TZDate } from '@date-fns/tz';
import { format, isValid, parse } from 'date-fns';
import { de } from 'date-fns/locale';

// every timestamp is stored in utc and read and written in one zone. the app is german, so the
// zone is fixed rather than offered as a setting — an admin and a guest must never disagree about
// when the deadline is.

export const EVENT_TIME_ZONE = 'Europe/Berlin';

const INPUT_PATTERN = 'yyyy-MM-dd HH:mm';
const DISPLAY_PATTERN = "d. MMMM yyyy, HH:mm 'Uhr'";
const SHORT_PATTERN = 'dd.MM.yyyy, HH:mm';

// the value of an <input type="datetime-local">, read as berlin wall-clock time
export function parseBerlinDateTime(value: null | string | undefined): Date | null {
	if (!value) {
		return null;
	}

	const normalized = value.replace('T', ' ').slice(0, INPUT_PATTERN.length);
	const parsed = parse(normalized, INPUT_PATTERN, new TZDate(Date.now(), EVENT_TIME_ZONE));

	if (!isValid(parsed)) {
		return null;
	}

	return new Date(parsed.getTime());
}

// the reverse: fills a datetime-local input without dragging the browser's own zone into it
export function toBerlinInputValue(date: Date | null): string {
	if (!date) {
		return '';
	}

	return format(new TZDate(date, EVENT_TIME_ZONE), "yyyy-MM-dd'T'HH:mm");
}

export function formatBerlin(date: Date | null): string {
	if (!date) {
		return '';
	}

	return format(new TZDate(date, EVENT_TIME_ZONE), DISPLAY_PATTERN, { locale: de });
}

export function formatBerlinShort(date: Date | null): string {
	if (!date) {
		return '';
	}

	return format(new TZDate(date, EVENT_TIME_ZONE), SHORT_PATTERN, { locale: de });
}
