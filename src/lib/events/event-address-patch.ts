import 'server-only';
import type { EventAddress } from '@/lib/events/event-location';
import type { EventPatch } from '@/lib/events/event-repository';

import { addressSearchQuery } from '@/lib/events/event-location';
import { geocodingService } from '@/lib/events/event-services';

// the one place an address turns into a patch. both the settings form and the mcp tool go through
// it, so the coordinates can never be left behind by whichever of the two wrote the address last.

export type AddressInput = {
	city: null | string;
	name: null | string;
	postalCode: null | string;
	street: null | string;
};

export type AddressPatch = Pick<
	EventPatch,
	'locationCity' | 'locationLatitude' | 'locationLongitude' | 'locationName' | 'locationPostalCode' | 'locationStreet'
>;

function toAddress(input: AddressInput): EventAddress {
	return { ...input, latitude: null, longitude: null };
}

// a host who mistyped the street would otherwise keep the old pin, which is worse than no map at
// all — so the coordinates are re-read whenever the searched address changes, and cleared when the
// geocoder cannot place it.
export async function resolveAddressPatch(input: AddressInput, current: EventAddress): Promise<AddressPatch> {
	const address = toAddress(input);
	const base = {
		locationCity: address.city,
		locationName: address.name,
		locationPostalCode: address.postalCode,
		locationStreet: address.street,
	};

	if (addressSearchQuery(address) === addressSearchQuery(current)) {
		return { ...base, locationLatitude: current.latitude, locationLongitude: current.longitude };
	}

	const located = await geocodingService.locate(address);

	return {
		...base,
		locationLatitude: located.success ? located.data.latitude : null,
		locationLongitude: located.success ? located.data.longitude : null,
	};
}
