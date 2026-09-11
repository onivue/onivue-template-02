import {
	Archive,
	BellRing,
	CalendarPlus,
	ChartColumn,
	Fingerprint,
	Link2,
	ListChecks,
	Table2,
	Users,
} from 'lucide-react';

import {
	LandingSection,
	LandingSectionDescription,
	LandingSectionHeader,
	LandingSectionLabel,
	LandingSectionTitle,
} from '@/components/landing/landing-section';

const FEATURES = [
	{
		description:
			'Namen zeilenweise einfügen: „Anna Meier, Ben Meier“ wird eine Einladung für zwei Personen. Bis zu 500 Einladungen auf einmal.',
		icon: Users,
		title: 'Gästeliste in Sekunden',
	},
	{
		description:
			'Jede Einladung hat ihren eigenen Link. Kein Login, keine App — der Gast öffnet ihn und antwortet direkt.',
		icon: Link2,
		title: 'Persönliche Einladungslinks',
	},
	{
		description:
			'Menüwunsch, Allergien, Übernachtung: Fragen frei bauen — für jede Person einzeln oder einmal pro Einladung, freiwillig oder als Pflichtfeld.',
		icon: ListChecks,
		title: 'Eigene Fragen',
	},
	{
		description:
			'Zusagen, Absagen und offene Einladungen laufen live zusammen. Filtern, nachfassen — und sehen, wer die Einladung schon geöffnet hat.',
		icon: ChartColumn,
		title: 'Der Stand auf einen Blick',
	},
	{
		description:
			'Wer zusagt, bekommt den Termin als Kalender-Datei und die Adresse auf einer Karte — ohne dass du Details nachreichen musst.',
		icon: CalendarPlus,
		title: 'Kalender und Anfahrt',
	},
	{
		description: 'Setz eine Antwort-Frist und lass dich per E-Mail benachrichtigen, sobald jemand zu- oder absagt.',
		icon: BellRing,
		title: 'Frist und Benachrichtigung',
	},
] as const;

const EXTRAS = [
	{ description: 'Alle Antworten als CSV — für Caterer, Sitzplan oder Tabelle.', icon: Table2, title: 'Export' },
	{
		description: 'Vorbei ist vorbei: Events wandern ins Archiv, die Antworten bleiben.',
		icon: Archive,
		title: 'Archiv',
	},
	{
		description: 'Anmeldung mit Passkey oder E-Mail und Passwort — ganz wie du magst.',
		icon: Fingerprint,
		title: 'Passkey-Login',
	},
] as const;

export function LandingFeatures() {
	return (
		<LandingSection data-testid='landing-features'>
			<LandingSectionHeader>
				<LandingSectionLabel>Was drin ist</LandingSectionLabel>
				<LandingSectionTitle>Alles, was zwischen Einladung und Fest passiert.</LandingSectionTitle>
				<LandingSectionDescription>
					Eine Oberfläche für die Gästeliste, die Antworten und die Details — kein Tabellenblatt daneben.
				</LandingSectionDescription>
			</LandingSectionHeader>

			<ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{FEATURES.map((feature) => (
					<li className='design-panel grid content-start gap-3 p-5' key={feature.title}>
						<span className='flex size-10 items-center justify-center rounded-2xl border border-border text-accent-strong'>
							<feature.icon className='size-5' aria-hidden='true' />
						</span>
						<h3 className='text-base leading-tight font-bold text-ink'>{feature.title}</h3>
						<p className='text-sm text-ink-soft'>{feature.description}</p>
					</li>
				))}
			</ul>

			<ul className='grid gap-4 sm:grid-cols-3'>
				{EXTRAS.map((extra) => (
					<li className='flex items-start gap-3 rounded-2xl border border-border px-4 py-4' key={extra.title}>
						<extra.icon className='mt-0.5 size-4 shrink-0 text-accent-strong' aria-hidden='true' />
						<span className='grid gap-1'>
							<span className='text-sm font-bold text-ink'>{extra.title}</span>
							<span className='text-sm text-ink-soft'>{extra.description}</span>
						</span>
					</li>
				))}
			</ul>
		</LandingSection>
	);
}
