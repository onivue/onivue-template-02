'use client';

import type { ResponseWindowInput } from '@/lib/events/response-window';

import { formatBerlin } from '@/lib/events/berlin-time';
import { resolveResponseWindow } from '@/lib/events/response-window';

// read against the reader's own clock rather than the server's. a verdict computed on the server
// would be cached with the panel and could go on claiming "offen" after the deadline had passed.
export function ResponseWindowStatus({ input }: { input: ResponseWindowInput }) {
	const window = resolveResponseWindow(input, new Date());

	if (!window.open) {
		return (
			<span data-testid='response-window'>
				{window.reason === 'archived'
					? 'Geschlossen — das Event ist archiviert'
					: 'Geschlossen — die Frist ist abgelaufen'}
			</span>
		);
	}

	return (
		<span data-testid='response-window'>
			{window.closesAt ? `Offen bis ${formatBerlin(window.closesAt, 'end-of-day')}` : 'Offen, ohne Frist'}
		</span>
	);
}
