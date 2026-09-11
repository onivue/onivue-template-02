'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { eventPath } from '@/config/routes';
import { cn } from '@/lib/utils';

const SECTIONS = [
	{ label: 'Übersicht & Gäste', section: undefined },
	{ label: 'Formular & Einstellungen', section: 'settings' },
] as const;

const TAB_CLASS = 'rounded-full px-4 py-2 text-sm font-medium transition-colors';
const NAV_CLASS = 'flex flex-wrap gap-1 pb-2';

// real routes rather than client-side tabs, so each section is linkable and loads its own data. the
// id comes from the url, not a prop, so the tabs owe nothing to a query.
export function EventTabs() {
	const { eventId } = useParams<{ eventId: string }>();
	const pathname = usePathname();

	return (
		<nav className={NAV_CLASS} data-testid='event-tabs'>
			{SECTIONS.map((entry) => {
				const href = eventPath(eventId, entry.section);
				const isActive = pathname === href;

				return (
					<Link
						className={cn(
							TAB_CLASS,
							// the accent is a highlighter: too loud as a fill this size, so the active tab
							// takes the calm ink pill and the accent stays for small emphasis
							isActive
								? 'bg-ink font-bold text-background'
								: 'text-ink-soft hover:bg-muted hover:text-ink'
						)}
						data-testid={`event-tab-${entry.section ?? 'overview'}`}
						href={href}
						key={entry.label}
					>
						{entry.label}
					</Link>
				);
			})}
		</nav>
	);
}

// shown only on a cold load, where the id is not known yet
export function EventTabsFallback() {
	return (
		<nav className={NAV_CLASS} data-testid='event-tabs-fallback'>
			{SECTIONS.map((entry) => (
				<span className={cn(TAB_CLASS, 'text-ink-soft/60')} key={entry.label}>
					{entry.label}
				</span>
			))}
		</nav>
	);
}
