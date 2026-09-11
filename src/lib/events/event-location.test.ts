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

const GOSSAU = address({
	city: 'Gossau',
	name: 'Gasthaus Krone',
	postalCode: '9200',
	street: 'Bachwiesenstrasse 9A',
});

describe('the address a guest reads', () => {
	test('runs venue, street, postal line — top to bottom', () => {
		expect(addressLines(GOSSAU)).toEqual(['Gasthaus Krone', 'Bachwiesenstrasse 9A', '9200 Gossau']);
	});

	test('drops the lines that were never filled in', () => {
		expect(addressLines(address({ city: 'Gossau', street: 'Bachwiesenstrasse 9A' }))).toEqual([
			'Bachwiesenstrasse 9A',
			'Gossau',
		]);
	});

	test('an empty address has nothing to show', () => {
		expect(hasAddress(address({ city: '   ' }))).toBe(false);
		expect(addressSingleLine(address())).toBeNull();
	});

	test('the postal line reads as it is written on an envelope', () => {
		expect(addressCityLine(GOSSAU)).toBe('9200 Gossau');
		expect(addressCityLine(address({ city: 'Gossau' }))).toBe('Gossau');
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
		expect(addressSearchQuery(GOSSAU)).toBe('Bachwiesenstrasse 9A, 9200 Gossau');
	});

	test('falls back to the venue name when there is no street', () => {
		expect(addressSearchQuery(address({ city: 'Gossau', name: 'Gasthaus Krone' }))).toBe('Gasthaus Krone, Gossau');
	});
});

describe('the map links', () => {
	test('are built from the address, never pasted in', () => {
		expect(googleMapsUrl(GOSSAU)).toBe(
			'https://www.google.com/maps/search/?api=1&query=Bachwiesenstrasse+9A%2C+9200+Gossau'
		);
		expect(appleMapsUrl(GOSSAU)).toBe('https://maps.apple.com/?q=Bachwiesenstrasse+9A%2C+9200+Gossau');
	});

	test('apple maps is centred on the coordinates once they are known', () => {
		expect(appleMapsUrl({ ...GOSSAU, latitude: 47.4161, longitude: 9.2513 })).toContain('&ll=47.4161%2C9.2513');
	});

	test('there is no link without an address', () => {
		expect(googleMapsUrl(address())).toBeNull();
		expect(appleMapsUrl(address())).toBeNull();
	});
});
