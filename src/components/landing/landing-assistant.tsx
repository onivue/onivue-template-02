import { Bot } from 'lucide-react';

import {
	LandingSection,
	LandingSectionDescription,
	LandingSectionHeader,
	LandingSectionLabel,
	LandingSectionTitle,
} from '@/components/landing/landing-section';

const ASSISTANT_PROMPTS = [
	'Leg ein Event „Sommerfest“ am 12. Juli um 17:00 an.',
	'Trag Anna und Ben Meier als eine Einladung ein.',
	'Wer hat noch nicht geantwortet?',
] as const;

export function LandingAssistant() {
	return (
		<LandingSection data-testid='landing-assistant'>
			<LandingSectionHeader>
				<LandingSectionLabel>MCP-Server</LandingSectionLabel>
				<LandingSectionTitle>Oder du sagst es einfach deinem KI-Assistenten.</LandingSectionTitle>
				<LandingSectionDescription>
					event.onivue bringt einen eigenen MCP-Server mit. Einmal mit Claude & Co. verbunden, legst du Events
					an, trägst Gäste ein und fragst den Stand der Zusagen im Chat ab — mit deinem Konto, über OAuth
					abgesichert, und nur mit den Rechten, die du freigibst.
				</LandingSectionDescription>
			</LandingSectionHeader>

			<ul className='grid gap-3 sm:grid-cols-3'>
				{ASSISTANT_PROMPTS.map((prompt) => (
					<li className='design-panel flex items-start gap-3 p-5' key={prompt}>
						<Bot className='mt-0.5 size-4 shrink-0 text-accent-strong' aria-hidden='true' />
						<span className='text-sm font-medium text-ink'>„{prompt}“</span>
					</li>
				))}
			</ul>
		</LandingSection>
	);
}
