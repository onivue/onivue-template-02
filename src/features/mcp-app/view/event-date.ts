import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

// the tools answer in ISO; nothing in the view does date maths, it only reads

const DAY_FORMAT = 'EEEE, d. MMMM yyyy';
const TIME_FORMAT = "HH:mm 'Uhr'";

export function formatEventDate(value: null | string): null | string {
	if (!value) {
		return null;
	}

	const parsed = parseISO(value);

	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return `${format(parsed, DAY_FORMAT, { locale: de })}, ${format(parsed, TIME_FORMAT, { locale: de })}`;
}

export function formatSentDate(value: null | string): null | string {
	if (!value) {
		return null;
	}

	const parsed = parseISO(value);

	return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'd. MMM yyyy', { locale: de });
}
