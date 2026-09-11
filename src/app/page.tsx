import { LandingAssistant } from '@/components/landing/landing-assistant';
import { LandingClosing } from '@/components/landing/landing-closing';
import { LandingFeatures } from '@/components/landing/landing-features';
import { LandingGuestView } from '@/components/landing/landing-guest-view';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingHero } from '@/components/landing/landing-hero';
import { LandingSteps } from '@/components/landing/landing-steps';
import { Footer } from '@/components/layout/footer';

// the public face of the app. it reads no session: the proxy hands a signed-in reader to the
// events list before this page renders, so it stays a static shell
export default function HomePage() {
	return (
		<div className='flex flex-col bg-background text-foreground'>
			<main
				className='flex-1 px-[clamp(1rem,3vw,1.5rem)] pt-[max(1rem,env(safe-area-inset-top))] pb-10'
				data-testid='landing-page'
			>
				<div className='mx-auto grid w-full max-w-6xl gap-[clamp(3rem,7vw,6rem)]'>
					<div className='grid gap-[clamp(2rem,5vw,4rem)]'>
						<LandingHeader />
						<LandingHero />
					</div>

					<LandingSteps />
					<LandingFeatures />
					<LandingGuestView />
					<LandingAssistant />
					<LandingClosing />
				</div>
			</main>
			<Footer />
		</div>
	);
}
