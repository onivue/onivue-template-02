import { describe, expect, test } from 'bun:test';

import type { EventAddress } from '@/lib/events/event-location';

import {
	addressCityLine,
	addressCoordinates,
	addressLines,
	addressSearchQuery,
	addressSingleLine,
	appleMapsUrl,
	googleMapsUrl,
	hasAddress,
} from '@/lib/events/event-location';

function address(overrides: Partial<EventAddress> = {}): EventAddress {
	return { city: null, latitude: null, longitude: null, name: null, postalCode: null, street: null, ...overrides };
}

const MUSTERSTADT = address({
	city: 'Musterstadt',
	name: 'Gasthaus Krone',
	postalCode: '1234',
	street: 'Musterstrasse 12',
});

describe('the address a guest reads', () => {
	test('runs venue, street, postal line — top to bottom', () => {
		expect(addressLines(MUSTERSTADT)).toEqual(['Gasthaus Krone', 'Musterstrasse 12', '1234 Musterstadt']);
	});

	test('drops the lines that were never filled in', () => {
		expect(addressLines(address({ city: 'Musterstadt', street: 'Musterstrasse 12' }))).toEqual([
			'Musterstrasse 12',
			'Musterstadt',
		]);
	});

	test('an empty address has nothing to show', () => {
		expect(hasAddress(address({ city: '   ' }))).toBe(false);
		expect(addressSingleLine(address())).toBeNull();
	});

	test('the postal line reads as it is written on an envelope', () => {
		expect(addressCityLine(MUSTERSTADT)).toBe('1234 Musterstadt');
		expect(addressCityLine(address({ city: 'Musterstadt' }))).toBe('Musterstadt');
		expect(addressCityLine(address())).toBeNull();
	});

	test('one coordinate alone is no position', () => {
		expect(addressCoordinates(address({ latitude: 47.4 }))).toBeNull();
		expect(addressCoordinates(address({ latitude: 47.4, longitude: 9.25 }))).toEqual({
			latitude: 47.4,
			longitude: 9.25,
		});
	});
});

describe('what the map apps are asked to find', () => {
	test('is the postal address, without the venue name', () => {
		expect(addressSearchQuery(MUSTERSTADT)).toBe('Musterstrasse 12, 1234 Musterstadt');
	});

	test('falls back to the venue name when there is no street', () => {
		expect(addressSearchQuery(address({ city: 'Musterstadt', name: 'Gasthaus Krone' }))).toBe(
			'Gasthaus Krone, Musterstadt'
		);
	});
});

describe('the map links', () => {
	test('are built from the address, never pasted in', () => {
		expect(googleMapsUrl(MUSTERSTADT)).toBe(
			'https://www.google.com/maps/search/?api=1&query=Musterstrasse+12%2C+1234+Musterstadt'
		);
		expect(appleMapsUrl(MUSTERSTADT)).toBe('https://maps.apple.com/?q=Musterstrasse+12%2C+1234+Musterstadt');
	});

	test('apple maps is centred on the coordinates once they are known', () => {
		expect(appleMapsUrl({ ...MUSTERSTADT, latitude: 47.4161, longitude: 9.2513 })).toContain(
			'&ll=47.4161%2C9.2513'
		);
	});

	test('there is no link without an address', () => {
		expect(googleMapsUrl(address())).toBeNull();
		expect(appleMapsUrl(address())).toBeNull();
	});
});
