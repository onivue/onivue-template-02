import { CalendarPlus, MapPin, PartyPopper, Smartphone } from 'lucide-react';

import {
	LandingSection,
	LandingSectionDescription,
	LandingSectionHeader,
	LandingSectionLabel,
	LandingSectionTitle,
} from '@/components/landing/landing-section';

const GUEST_POINTS = [
	{
		description: 'Der Link öffnet die Einladung — kein Konto, kein Download, kein Passwort.',
		icon: Smartphone,
		title: 'Ein Link genügt',
	},
	{
		description: 'Zusagen oder absagen, für sich allein oder für die ganze Begleitung auf der Einladung.',
		icon: PartyPopper,
		title: 'Antwort in einem Tippen',
	},
	{
		description: 'Doch etwas dazwischengekommen? Bis zur Frist lässt sich die Antwort jederzeit ändern.',
		icon: CalendarPlus,
		title: 'Meinung geändert? Kein Problem',
	},
	{
		description: 'Nach der Zusage: Termin in den Kalender, Adresse auf der Karte — und Konfetti.',
		icon: MapPin,
		title: 'Alles Wichtige danach',
	},
] as const;

export function LandingGuestView() {
	return (
		<LandingSection data-testid='landing-guest-view'>
			<LandingSectionHeader>
				<LandingSectionLabel>Die Gästeseite</LandingSectionLabel>
				<LandingSectionTitle>Was deine Gäste sehen.</LandingSectionTitle>
				<LandingSectionDescription>
					Die Einladung ist für das Handy gebaut: groß genug zum Antworten, kurz genug zum Durchlesen — und
					sie funktioniert auch für die Tante, die keine App installiert.
				</LandingSectionDescription>
			</LandingSectionHeader>

			<div className='grid gap-4 rounded-3xl bg-sidebar-primary p-5 text-sidebar-primary-foreground sm:grid-cols-2 sm:p-8'>
				{GUEST_POINTS.map((point) => (
					<div className='grid content-start gap-2' key={point.title}>
						<span className='flex size-10 items-center justify-center rounded-2xl bg-sidebar-accent/15 text-sidebar-accent'>
							<point.icon className='size-5' aria-hidden='true' />
						</span>
						<h3 className='text-base leading-tight font-bold'>{point.title}</h3>
						<p className='text-sm text-sidebar-primary-foreground/75'>{point.description}</p>
					</div>
				))}
			</div>
		</LandingSection>
	);
}
