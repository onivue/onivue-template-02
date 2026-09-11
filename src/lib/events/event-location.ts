// where the event is. the parts are held apart rather than as one block of text, because the map
// links and the geocoder are both built from street and postal code — a free-text field would have
// to be taken apart again at every call site.

export type EventAddress = {
	city: null | string;
	latitude: null | number;
	longitude: null | number;
	name: null | string;
	postalCode: null | string;
	street: null | string;
};

export type Coordinates = {
	latitude: number;
	longitude: number;
};

// the columns as they are stored. every reader of an event — the guest page, the ics file, the
// admin panel — narrows to EventAddress through this, rather than passing six fields around.
export type AddressColumns = {
	locationCity: null | string;
	locationLatitude: null | number;
	locationLongitude: null | number;
	locationName: null | string;
	locationPostalCode: null | string;
	locationStreet: null | string;
};

const LINE_SEPARATOR = ', ';
const APPLE_MAPS_URL = 'https://maps.apple.com/';
const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/';

function clean(value: null | string | undefined): null | string {
	const trimmed = value?.trim();

	return trimmed ? trimmed : null;
}

export function toEventAddress(columns: AddressColumns): EventAddress {
	return {
		city: columns.locationCity,
		latitude: columns.locationLatitude,
		longitude: columns.locationLongitude,
		name: columns.locationName,
		postalCode: columns.locationPostalCode,
		street: columns.locationStreet,
	};
}

// the postal line as it is written on an envelope: "9200 Gossau", or either half alone
export function addressCityLine(address: EventAddress): null | string {
	return clean([clean(address.postalCode), clean(address.city)].filter(Boolean).join(' '));
}

export function addressCoordinates(address: EventAddress): Coordinates | null {
	const { latitude, longitude } = address;

	if (typeof latitude !== 'number' || typeof longitude !== 'number') {
		return null;
	}

	return { latitude, longitude };
}

// what the guest reads, top to bottom: venue, street, postal line
export function addressLines(address: EventAddress): string[] {
	return [clean(address.name), clean(address.street), addressCityLine(address)].filter((line): line is string =>
		Boolean(line)
	);
}

export function hasAddress(address: EventAddress): boolean {
	return addressLines(address).length > 0;
}

// the one string both map apps and the geocoder are handed. the venue name is left out whenever
// there is a street: a searched name matches the wrong branch far more often than an address does.
export function addressSearchQuery(address: EventAddress): null | string {
	const street = clean(address.street);
	const cityLine = addressCityLine(address);
	const parts = street ? [street, cityLine] : [clean(address.name), cityLine];

	return parts.filter(Boolean).join(LINE_SEPARATOR) || null;
}

export function addressSingleLine(address: EventAddress): null | string {
	return addressLines(address).join(LINE_SEPARATOR) || null;
}

// the two deep links below are built from the address alone — nothing here is a link a host pasted
// in, so a corrected street can never leave a stale pin behind. each opens the place in its app,
// where the reader's own starting point is what a route needs anyway.

// searching by address rather than by coordinates keeps the pin labelled with the street instead of
// a pair of numbers; the coordinates only centre the map when we have them.
export function appleMapsUrl(address: EventAddress): null | string {
	const query = addressSearchQuery(address);

	if (!query) {
		return null;
	}

	const coordinates = addressCoordinates(address);
	const parameters = new URLSearchParams({ q: query });

	if (coordinates) {
		parameters.set('ll', `${coordinates.latitude},${coordinates.longitude}`);
	}

	return `${APPLE_MAPS_URL}?${parameters.toString()}`;
}

export function googleMapsUrl(address: EventAddress): null | string {
	const query = addressSearchQuery(address);

	if (!query) {
		return null;
	}

	return `${GOOGLE_MAPS_SEARCH_URL}?${new URLSearchParams({ api: '1', query }).toString()}`;
}
