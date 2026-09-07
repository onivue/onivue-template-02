// the 3d ornament a host may put on the guest page. a curated set, kept as text in the database so
// adding the next one is a change here rather than a migration.

export const DECORATIONS = {
	'birthday-cake': {
		description: 'Eine angeschnittene Geburtstagstorte mit brennender Kerze.',
		label: 'Geburtstagstorte',
	},
	'birthday-cake-slice': {
		description: 'Ein Stück Geburtstagstorte mit brennender Kerze.',
		label: 'Tortenstück',
	},
} as const;

export type DecorationKey = keyof typeof DECORATIONS;

export const DECORATION_KEYS = Object.keys(DECORATIONS) as DecorationKey[];

export function isDecorationKey(value: null | string | undefined): value is DecorationKey {
	return typeof value === 'string' && value in DECORATIONS;
}
