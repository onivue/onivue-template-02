import { Bus, CircleParking, Gift, Info, Martini, Music, Shirt, UtensilsCrossed } from 'lucide-react';

import type { EventNoteIcon as EventNoteIconKey } from '@/lib/events/event-note';

import { cn } from '@/lib/utils';

// which lucide icon each key draws. the keys live in the lib beside their labels, so the server can
// validate one without pulling an icon set in with it.
const ICONS = {
	drinks: Martini,
	dresscode: Shirt,
	food: UtensilsCrossed,
	gift: Gift,
	info: Info,
	music: Music,
	parking: CircleParking,
	travel: Bus,
} satisfies Record<EventNoteIconKey, typeof Info>;

export function EventNoteIcon({ className, icon }: { className?: string; icon: EventNoteIconKey }) {
	const Icon = ICONS[icon];

	return <Icon aria-hidden='true' className={cn('size-5', className)} />;
}
