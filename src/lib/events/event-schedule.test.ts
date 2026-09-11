import { describe, expect, test } from 'bun:test';

import { parseBerlinDateTime } from '@/lib/events/berlin-time';
import { describeSchedule } from '@/lib/events/event-schedule';

const at = (value: string) => parseBerlinDateTime(value);

describe('when the event is', () => {
	test('an event without a date says nothing', () => {
		expect(describeSchedule(null, at('2026-10-24T23:00'))).toBeNull();
	});

	test('a start alone opens the door without closing it', () => {
		expect(describeSchedule(at('2026-10-24T19:30'), null)).toEqual({
			date: 'Samstag, 24. Oktober 2026',
			time: 'ab 19:30 Uhr',
			until: null,
		});
	});

	test('an end on the same day makes a range, with the unit said once', () => {
		expect(describeSchedule(at('2026-10-24T19:30'), at('2026-10-24T23:00'))).toEqual({
			date: 'Samstag, 24. Oktober 2026',
			time: '19:30 – 23:00 Uhr',
			until: null,
		});
	});

	test('an end after midnight gets its own line, since the hour alone would mislead', () => {
		expect(describeSchedule(at('2026-10-24T19:30'), at('2026-10-25T02:00'))).toEqual({
			date: 'Samstag, 24. Oktober 2026',
			time: 'ab 19:30 Uhr',
			until: 'bis 25. Oktober 2026, 02:00 Uhr',
		});
	});

	test('a day given without an hour keeps the day alone', () => {
		expect(describeSchedule(at('2026-10-24'), null)).toEqual({
			date: 'Samstag, 24. Oktober 2026',
			time: null,
			until: null,
		});
	});
});
