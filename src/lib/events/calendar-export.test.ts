import { describe, expect, test } from 'bun:test';

import type { CalendarExportEvent } from '@/lib/events/calendar-export';

import { toIcs, toIcsFilename } from '@/lib/events/calendar-export';

const NOW = new Date('2026-06-01T10:00:00.000Z');

function event(overrides: Partial<CalendarExportEvent> = {}): CalendarExportEvent {
	return {
		endsAt: null,
		greeting: null,
		location: null,
		startsAt: new Date('2026-07-15T18:00:00.000Z'),
		title: 'Hochzeit von Anna & Ben',
		...overrides,
	};
}

describe('the add-to-calendar file', () => {
	test('is null when the event has no date yet', () => {
		expect(toIcs({ event: event({ startsAt: null }), now: NOW, uid: 'e1@event.onivue' })).toBeNull();
	});

	test('carries the title, start and a stable uid', () => {
		const ics = toIcs({ event: event(), now: NOW, uid: 'e1@event.onivue' });

		expect(ics).toContain('SUMMARY:Hochzeit von Anna & Ben');
		expect(ics).toContain('DTSTART:20260715T180000Z');
		expect(ics).toContain('UID:e1@event.onivue');
		expect(ics).toContain('DTSTAMP:20260601T100000Z');
	});

	test('defaults the end to an hour after the start when none is set', () => {
		const ics = toIcs({ event: event(), now: NOW, uid: 'e1@event.onivue' });

		expect(ics).toContain('DTEND:20260715T190000Z');
	});

	test('uses the given end when one is set', () => {
		const ics = toIcs({
			event: event({ endsAt: new Date('2026-07-15T22:00:00.000Z') }),
			now: NOW,
			uid: 'e1@event.onivue',
		});

		expect(ics).toContain('DTEND:20260715T220000Z');
	});

	test('location and greeting appear only when set', () => {
		const withoutThem = toIcs({ event: event(), now: NOW, uid: 'e1@event.onivue' });
		expect(withoutThem).not.toContain('LOCATION:');
		expect(withoutThem).not.toContain('DESCRIPTION:');

		const withThem = toIcs({
			event: event({ greeting: 'Wir freuen uns auf euch!', location: 'Schlossgarten 1' }),
			now: NOW,
			uid: 'e1@event.onivue',
		});
		expect(withThem).toContain('LOCATION:Schlossgarten 1');
		expect(withThem).toContain('DESCRIPTION:Wir freuen uns auf euch!');
	});

	test('semicolons, commas and newlines cannot break a field apart', () => {
		const ics = toIcs({
			event: event({ location: 'Saal 1; Etage 2, links\nHintereingang' }),
			now: NOW,
			uid: 'e1@event.onivue',
		});

		expect(ics).toContain('LOCATION:Saal 1\\; Etage 2\\, links\\nHintereingang');
	});

	test('the file is named after the event', () => {
		expect(toIcsFilename('Hochzeit von Anna & Ben')).toBe('hochzeit-von-anna-ben.ics');
		expect(toIcsFilename('  ')).toBe('event.ics');
	});
});
