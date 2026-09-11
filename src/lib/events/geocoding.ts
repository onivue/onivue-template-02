import 'server-only';
import { z } from 'zod';

import type { Coordinates, EventAddress } from '@/lib/events/event-location';

import { APP_CONFIG } from '@/config/app';
import { SERVER_CONFIG } from '@/config/env';
import { addressSearchQuery } from '@/lib/events/event-location';

// turning the host's address into a point on the map. it runs once, when the address is saved, and
// the result is stored with the event — a guest page must not depend on a third party being up.

export type GeocodeResult =
	| { data: Coordinates; success: true }
	| { reason: 'not-found' | 'unavailable'; success: false };

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// nominatim's usage policy asks every caller to identify itself and to stay at one request a second.
// a save is far below that, but the header is required either way.
const USER_AGENT = `${APP_CONFIG.app.name} (${SERVER_CONFIG.auth.origin})`;
const TIMEOUT_MS = 4000;

// nominatim answers with an array of places, each carrying its coordinates as strings
const placesSchema = z.array(z.object({ lat: z.coerce.number(), lon: z.coerce.number() })).min(1);

export class GeocodingService {
	public async locate(address: EventAddress): Promise<GeocodeResult> {
		const query = addressSearchQuery(address);

		if (!query) {
			return { reason: 'not-found', success: false };
		}

		const url = `${NOMINATIM_URL}?${new URLSearchParams({ format: 'jsonv2', limit: '1', q: query }).toString()}`;
		// a slow geocoder must not hold up saving the event, so the request is given a deadline
		const controller = new AbortController();
		const deadline = setTimeout(() => controller.abort(), TIMEOUT_MS);

		try {
			const response = await fetch(url, {
				headers: { 'Accept-Language': 'de', 'User-Agent': USER_AGENT },
				signal: controller.signal,
			});

			if (!response.ok) {
				return { reason: 'unavailable', success: false };
			}

			const places = placesSchema.safeParse(await response.json());

			if (!places.success) {
				return { reason: 'not-found', success: false };
			}

			const [place] = places.data;

			return { data: { latitude: place.lat, longitude: place.lon }, success: true };
		} catch {
			return { reason: 'unavailable', success: false };
		} finally {
			clearTimeout(deadline);
		}
	}
}
