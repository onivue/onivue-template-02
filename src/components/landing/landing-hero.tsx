import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

import { LandingInvitationPreview } from '@/components/landing/landing-invitation-preview';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';

const HERO_POINTS = [
	'Deine Gäste brauchen kein Konto',
	'Zu- und Absagen an einem Ort',
	'Eigene Fragen pro Event',
] as const;

export function LandingHero() {
	return (
		<section className='grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-12' data-testid='landing-hero'>
			<div className='grid gap-6'>
				<span className='design-section-label w-fit px-3 py-1.5'>Einladungen, die ankommen</span>

				<div className='grid gap-4'>
					<h1 className='design-page-title max-w-2xl text-balance'>Einladen. Zusagen. Feiern.</h1>
					<p className='design-page-description max-w-xl text-base'>
						Aus deiner Gästeliste werden persönliche Einladungslinks. Wer antwortet, was gewünscht wird und
						wer noch fehlt — alles läuft an einem Ort zusammen, statt in fünf Chats.
					</p>
				</div>

				<div className='flex flex-col gap-3 sm:flex-row'>
					<Button
						variant='strong'
						size='xl'
						nativeButton={false}
						render={<Link href={APP_ROUTES.REGISTER} />}
						data-testid='hero-register-link'
					>
						<span>Account erstellen</span>
						<ArrowRight data-icon='inline-end' aria-hidden='true' />
					</Button>
					<Button
						variant='outline'
						size='xl'
						nativeButton={false}
						render={<Link href={APP_ROUTES.LOGIN} />}
						data-testid='hero-login-link'
					>
						Anmelden
					</Button>
				</div>

				<ul className='flex flex-wrap gap-x-5 gap-y-2'>
					{HERO_POINTS.map((point) => (
						<li className='flex items-center gap-2 text-sm font-semibold text-ink' key={point}>
							<Check className='size-4 shrink-0 text-accent-strong' aria-hidden='true' />
							{point}
						</li>
					))}
				</ul>
			</div>

			<LandingInvitationPreview />
		</section>
	);
}
