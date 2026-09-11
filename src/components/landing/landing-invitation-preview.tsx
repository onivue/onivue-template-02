import { CalendarDays, MapPin } from 'lucide-react';

const RESPONSE_TILES = [
	{ label: 'Zusagen', value: '34' },
	{ label: 'Absagen', value: '6' },
	{ label: 'Offen', value: '12' },
] as const;

// an illustration of the guest link and the counters behind it, not real data — so it stays out of
// the accessibility tree and the sections around it carry the same information as text
export function LandingInvitationPreview() {
	return (
		<div className='design-panel grid gap-4 p-4 sm:p-5' aria-hidden='true' data-testid='landing-invitation-preview'>
			<div className='grid gap-3 rounded-2xl bg-sidebar-primary p-5 text-sidebar-primary-foreground'>
				<span className='text-[0.7rem] font-bold tracking-[0.12em] text-sidebar-accent uppercase'>
					Deine Einladung
				</span>
				<p className='text-2xl leading-tight font-bold text-balance'>Sommerfest bei Meiers</p>

				<div className='grid gap-1.5 text-sm text-sidebar-primary-foreground/75'>
					<span className='flex items-center gap-2'>
						<CalendarDays className='size-4 shrink-0' />
						Samstag, 12. Juli · 17:00
					</span>
					<span className='flex items-center gap-2'>
						<MapPin className='size-4 shrink-0' />
						Musterstrasse 12, 1234 Musterstadt
					</span>
				</div>

				<div className='mt-1 flex gap-2'>
					<span className='flex h-10 flex-1 items-center justify-center rounded-full bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground'>
						Ich bin dabei
					</span>
					<span className='flex h-10 flex-1 items-center justify-center rounded-full border border-sidebar-border text-sm font-semibold'>
						Leider nicht
					</span>
				</div>
			</div>

			<ul className='grid grid-cols-3 gap-2'>
				{RESPONSE_TILES.map((tile) => (
					<li
						className='grid gap-0.5 rounded-2xl border border-border px-3 py-3 text-center'
						key={tile.label}
					>
						<span className='text-xl leading-none font-bold text-ink'>{tile.value}</span>
						<span className='text-xs font-medium text-ink-soft'>{tile.label}</span>
					</li>
				))}
			</ul>

			<p className='rounded-2xl border border-border px-4 py-3 text-sm text-ink-soft'>
				<span className='font-bold text-ink'>Anna & Ben Meier</span> haben zugesagt · Menü: 1× vegetarisch
			</p>
		</div>
	);
}
