import {
	LandingSection,
	LandingSectionDescription,
	LandingSectionHeader,
	LandingSectionLabel,
	LandingSectionTitle,
} from '@/components/landing/landing-section';

const STEPS = [
	{
		description: 'Titel, Datum, Begrüßungstext. Adresse eintippen — die Karte findet den Ort dazu.',
		title: 'Event anlegen',
	},
	{
		description: 'Eine Zeile pro Einladung, Begleitung mit Komma dahinter. Aus dem Chat kopiert reicht völlig.',
		title: 'Gästeliste einfügen',
	},
	{
		description: 'Jede Einladung bekommt ihren eigenen Link. Du siehst, welcher schon verschickt ist.',
		title: 'Links verschicken',
	},
	{
		description: 'Zusagen, Absagen und offene Einladungen laufen ein — gezählt, gefiltert, exportierbar.',
		title: 'Antworten einsammeln',
	},
] as const;

export function LandingSteps() {
	return (
		<LandingSection data-testid='landing-steps'>
			<LandingSectionHeader>
				<LandingSectionLabel>In vier Schritten</LandingSectionLabel>
				<LandingSectionTitle>Vom losen Plan zur vollständigen Gästeliste.</LandingSectionTitle>
				<LandingSectionDescription>
					Kein Setup, keine Vorlagen-Auswahl: Das Event steht mit einem Titel, alles Weitere stellst du in
					Ruhe danach ein.
				</LandingSectionDescription>
			</LandingSectionHeader>

			<ol className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{STEPS.map((step, index) => (
					<li className='design-panel grid content-start gap-3 p-5' key={step.title}>
						<span className='flex size-9 items-center justify-center rounded-full bg-lime-glow text-sm font-bold text-ink'>
							{index + 1}
						</span>
						<h3 className='text-base leading-tight font-bold text-ink'>{step.title}</h3>
						<p className='text-sm text-ink-soft'>{step.description}</p>
					</li>
				))}
			</ol>
		</LandingSection>
	);
}
