import { describe, expect, test } from 'bun:test';

import { parseBerlinDateTime } from '@/lib/events/berlin-time';
import { invitationPreviewDescription } from '@/lib/events/invitation-preview';

function event(overrides: Partial<Parameters<typeof invitationPreviewDescription>[0]> = {}) {
	return {
		greeting: null,
		locationCity: null,
		locationLatitude: null,
		locationLongitude: null,
		locationName: null,
		locationPostalCode: null,
		locationStreet: null,
		startsAt: null,
		...overrides,
	};
}

describe('invitationPreviewDescription', () => {
	test('when and where come first, joined into one line', () => {
		expect(
			invitationPreviewDescription(
				event({
					locationCity: 'Musterstadt',
					locationName: 'Gasthaus Krone',
					locationPostalCode: '12345',
					locationStreet: 'Hauptstraße 1',
					startsAt: parseBerlinDateTime('2026-07-15T18:30'),
				})
			)
		).toBe('15. Juli 2026, 18:30 Uhr · Gasthaus Krone, Hauptstraße 1, 12345 Musterstadt');
	});

	test('a day without a time keeps its date and drops the hour', () => {
		expect(invitationPreviewDescription(event({ startsAt: parseBerlinDateTime('2026-07-15') }))).toBe(
			'15. Juli 2026'
		);
	});

	test('either fact alone still makes a line', () => {
		expect(invitationPreviewDescription(event({ locationName: 'Krone' }))).toBe('Krone');
		expect(invitationPreviewDescription(event({ startsAt: parseBerlinDateTime('2026-07-15T18:30') }))).toBe(
			'15. Juli 2026, 18:30 Uhr'
		);
	});

	test('without facts the host s own words stand in', () => {
		expect(invitationPreviewDescription(event({ greeting: 'Wir feiern!\nKomm vorbei.' }))).toBe('Wir feiern!');
	});

	test('an event that says nothing yet still gets a sentence', () => {
		expect(invitationPreviewDescription(event())).toContain('eingeladen');
	});

	test('a long greeting is cut rather than pasted into the preview whole', () => {
		const description = invitationPreviewDescription(event({ greeting: 'a'.repeat(500) }));

		expect(description.length).toBeLessThanOrEqual(200);
		expect(description.endsWith('…')).toBe(true);
	});
});
