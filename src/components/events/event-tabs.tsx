'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { eventPath } from '@/config/routes';
import { cn } from '@/lib/utils';

type EventTabsProps = {
	eventId: string;
};

const SECTIONS = [
	{ label: 'Übersicht', section: undefined },
	{ label: 'Gäste', section: 'guests' },
	{ label: 'Formular', section: 'form' },
	{ label: 'Design', section: 'design' },
	{ label: 'Einstellungen', section: 'settings' },
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
							'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
							isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-ink-soft hover:bg-muted'
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
