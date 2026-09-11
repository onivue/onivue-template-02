// shared basis for a download filename: an event title made safe for any filesystem, readable
// without needing umlauts.

export function slugifyEventTitle(title: string): string {
	return (
		title
			.toLowerCase()
			.replaceAll('ä', 'ae')
			.replaceAll('ö', 'oe')
			.replaceAll('ü', 'ue')
			.replaceAll('ß', 'ss')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'event'
	);
}
