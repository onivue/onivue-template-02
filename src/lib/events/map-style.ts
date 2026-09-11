import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { MapOptions } from 'maplibre-gl';

// the map's own style sheet. maplibre parses colours itself and knows nothing of css custom
// properties, so the palette is written out here rather than read from the tokens — it is the warm
// off-white and soft border of globals.css, converted to hex. the app renders light only, so there
// is one palette.
//
// tiles, glyphs and sprites come from openfreemap, which serves openstreetmap data without a key.

const TILES_URL = 'https://tiles.openfreemap.org/planet';
const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const ATTRIBUTION = '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SOURCE = 'basemap';

const PALETTE = {
	// the ground the map sits on, a shade below --background so the white streets cut into it
	canvas: '#f0f0ec',
	land: '#eaeae5',
	building: '#dcdcd6',
	water: '#c9e0ef',
	park: '#dff0d8',
	// --surface-elevated: streets read as the light lines drawn through the land
	street: '#ffffff',
	streetCasing: '#dcdcd6',
	// --ink-soft
	label: '#545860',
	// --background
	labelHalo: '#f9f9f6',
} as const;

const LABEL_FONT = ['Noto Sans Regular'];
// the tiles carry lines and polygons in the same layer, so every fill has to say which it wants
const POLYGONS: ExpressionSpecification = ['match', ['geometry-type'], ['MultiPolygon', 'Polygon'], true, false];
const LINES: ExpressionSpecification = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const NOT_TUNNEL: ExpressionSpecification = ['!=', ['get', 'brunnel'], 'tunnel'];
// only the streets around the pin matter on a card this size; below it the map is a shape, not a plan
const STREET_LABEL_MIN_ZOOM = 15;

export const MAP_ZOOM = 15.5;

export type MapStyle = Exclude<MapOptions['style'], string | undefined>;

export function createMapStyle(): MapStyle {
	return {
		version: 8,
		glyphs: GLYPHS_URL,
		sources: {
			[SOURCE]: { attribution: ATTRIBUTION, type: 'vector', url: TILES_URL },
		},
		layers: [
			{ id: 'canvas', type: 'background', paint: { 'background-color': PALETTE.canvas } },
			{
				id: 'land',
				type: 'fill',
				source: SOURCE,
				'source-layer': 'landuse',
				filter: ['all', POLYGONS, ['==', ['get', 'class'], 'residential']],
				paint: { 'fill-color': PALETTE.land },
			},
			{
				id: 'park',
				type: 'fill',
				source: SOURCE,
				'source-layer': 'park',
				filter: POLYGONS,
				paint: { 'fill-color': PALETTE.park },
			},
			{
				id: 'water',
				type: 'fill',
				source: SOURCE,
				'source-layer': 'water',
				filter: ['all', POLYGONS, NOT_TUNNEL],
				paint: { 'fill-color': PALETTE.water },
			},
			{
				id: 'building',
				type: 'fill',
				source: SOURCE,
				'source-layer': 'building',
				minzoom: 13,
				filter: POLYGONS,
				paint: { 'fill-color': PALETTE.building },
			},
			{
				id: 'street-casing',
				type: 'line',
				source: SOURCE,
				'source-layer': 'transportation',
				filter: ['all', LINES, NOT_TUNNEL],
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': PALETTE.streetCasing,
					'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 7, 18, 22],
				},
			},
			{
				id: 'street',
				type: 'line',
				source: SOURCE,
				'source-layer': 'transportation',
				filter: ['all', LINES, NOT_TUNNEL],
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': PALETTE.street,
					'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 5, 18, 18],
				},
			},
			{
				id: 'street-label',
				type: 'symbol',
				source: SOURCE,
				'source-layer': 'transportation_name',
				minzoom: STREET_LABEL_MIN_ZOOM,
				filter: LINES,
				layout: {
					'symbol-placement': 'line',
					'text-field': ['get', 'name'],
					'text-font': LABEL_FONT,
					'text-size': 11,
				},
				paint: { 'text-color': PALETTE.label, 'text-halo-color': PALETTE.labelHalo, 'text-halo-width': 1.2 },
			},
			{
				id: 'place-label',
				type: 'symbol',
				source: SOURCE,
				'source-layer': 'place',
				maxzoom: STREET_LABEL_MIN_ZOOM,
				layout: {
					'text-field': ['get', 'name'],
					'text-font': LABEL_FONT,
					'text-size': 12,
				},
				paint: { 'text-color': PALETTE.label, 'text-halo-color': PALETTE.labelHalo, 'text-halo-width': 1.2 },
			},
		],
	};
}
