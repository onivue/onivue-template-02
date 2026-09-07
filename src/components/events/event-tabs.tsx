'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { eventPath } from '@/config/routes';
import { cn } from '@/lib/utils';

type EventTabsProps = {
	eventId: string;
};

const SECTIONS = [
	{ label: 'Übersicht & Gäste', section: undefined },
	{ label: 'Formular & Einstellungen', section: 'settings' },
] as const;

// real routes rather than client-side tabs: every section is linkable, and each one loads its own
// data instead of the page loading all of it
export function EventTabs({ eventId }: EventTabsProps) {
	const pathname = usePathname();

	return (
		<nav className='flex flex-wrap gap-1 border-b border-border pb-2' data-testid='event-tabs'>
			{SECTIONS.map((entry) => {
				const href = eventPath(eventId, entry.section);
				const isActive = pathname === href;

				return (
					<Link
						className={cn(
							'rounded-full px-4 py-2 text-sm font-medium transition-colors',
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
