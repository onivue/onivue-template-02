'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

import { createMapStyle, MAP_ZOOM } from '@/lib/events/map-style';
import { cn } from '@/lib/utils';

type EventLocationMapProps = {
	className?: string;
	latitude: number;
	longitude: number;
};

const WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';
const PIN_CLASS = 'size-3.5 rounded-full border-2 border-surface-elevated bg-action-strong ring-4 ring-lime-glow/50';

export function EventLocationMap({ className, latitude, longitude }: EventLocationMapProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// webgl is an external system with its own lifecycle: it has to be created against a real
	// element and torn down by hand. that is what an effect is for.
	useEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return;
		}

		let cancelled = false;
		let map: null | { remove: () => void } = null;

		const start = async () => {
			// maplibre is a heavy import for a page that mostly asks yes or no, so it arrives only once
			// an invitation actually carries a located address
			const { Map, Marker, setWorkerUrl } = await import('maplibre-gl');

			// maplibre looks for its worker next to its own module url, which a bundler rewrites — it
			// then starts a worker pointed at the html document and quietly loads no tiles at all. the
			// maplibre:worker script copies the two files this path serves.
			setWorkerUrl(WORKER_URL);

			if (cancelled) {
				return;
			}

			const center: [number, number] = [longitude, latitude];
			const instance = new Map({
				attributionControl: { compact: true },
				center,
				container,
				// the card is a picture of where to go, not a map to explore — and a grabbing map inside
				// a scrolling invitation is the fastest way to trap a thumb on a phone
				interactive: false,
				style: createMapStyle(),
				zoom: MAP_ZOOM,
			});

			map = instance;

			const pin = document.createElement('div');

			pin.className = PIN_CLASS;
			new Marker({ element: pin }).setLngLat(center).addTo(instance);
		};

		void start();

		return () => {
			cancelled = true;
			map?.remove();
			map = null;
		};
	}, [latitude, longitude]);

	return (
		// decorative: the address stands right beside it in words and the map links lead to the same
		// place, so a reader who cannot see this loses nothing by having it skipped
		<div
			aria-hidden='true'
			className={cn('overflow-hidden bg-muted', className)}
			data-testid='event-location-map'
			ref={containerRef}
		/>
	);
}
