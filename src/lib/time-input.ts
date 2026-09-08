const HOURS_MAX = 23;
const MINUTES_MAX = 59;
const PAD_LENGTH = 2;

function pad(value: number): string {
	return String(value).padStart(PAD_LENGTH, '0');
}

// takes what a person actually types on the way to a time — '9', '9:3', '1830', '18.30' — and
// answers with 'HH:mm' or with nothing. nothing is a valid answer here: a date may have no time.
export function normalizeTimeInput(raw: string): string {
	const digits = raw.replace(/\D/g, '');

	if (digits.length === 0) {
		return '';
	}

	// one or two digits name an hour; three or four carry the minutes in the last two
	const hasMinutes = digits.length > PAD_LENGTH;
	const hours = Number(hasMinutes ? digits.slice(0, digits.length - PAD_LENGTH) : digits);
	const minutes = hasMinutes ? Number(digits.slice(-PAD_LENGTH)) : 0;

	if (hours > HOURS_MAX || minutes > MINUTES_MAX) {
		return '';
	}

	return `${pad(hours)}:${pad(minutes)}`;
}

const MINUTES_PER_DAY = 24 * 60;

export function buildTimeOptions(stepMinutes: number): string[] {
	const options: string[] = [];

	for (let minute = 0; minute < MINUTES_PER_DAY; minute += stepMinutes) {
		options.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
	}

	return options;
}
