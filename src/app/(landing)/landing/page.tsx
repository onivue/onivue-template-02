import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { APP_ROUTES } from '@/components/layout/navigation.config';

const LANDING_FEATURES = [
	'App-like navigation for desktop and mobile',
	'Compact auth flow prepared for Magic Link and Passkey',
	'Design tokens for consistent product UI',
] as const;

export const metadata = {
	title: 'Landing | onivue',
	description: 'A focused landing page for the onivue template.',
};

export default function LandingPage() {
	return (
		<main className='design-landing-shell' data-testid='landing-page'>
			<div className='design-landing-container'>
				<header
					className='design-landing-header flex items-center justify-between gap-4'
					data-testid='landing-header'
				>
					<Link
						href={APP_ROUTES.LANDING}
						className='text-lg font-bold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
					>
						onivue
					</Link>
					<nav className='flex items-center gap-2' aria-label='Landing navigation'>
						<Link
							href={APP_ROUTES.LOGIN}
							className='rounded-full px-4 py-2 text-sm font-bold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50'
						>
							Login
						</Link>
						<Link
							href={APP_ROUTES.REGISTER}
							className='design-action-dark inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-bold outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50'
						>
							Starten
						</Link>
					</nav>
				</header>

				<section
					className='design-landing-hero grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]'
					data-testid='landing-hero'
				>
					<div className='flex max-w-3xl flex-col gap-6'>
						<span className='design-eyebrow w-fit px-3 py-1'>Product template</span>
						<div className='flex flex-col gap-4'>
							<h1 className='design-page-title max-w-4xl'>Build focused apps with a calm interface.</h1>
							<p className='design-page-copy max-w-xl text-base'>
								onivue combines a restrained product shell, mobile-first navigation, and auth-ready
								screens into one reusable Next.js starter.
							</p>
						</div>
						<div className='flex flex-col gap-3 sm:flex-row'>
							<Link
								href={APP_ROUTES.REGISTER}
								className='design-action-dark inline-flex min-h-12 items-center justify-center gap-2 px-6 text-sm font-bold outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50'
							>
								<span>Account erstellen</span>
								<ArrowRight data-icon='inline-end' aria-hidden='true' />
							</Link>
							<Link
								href={APP_ROUTES.LOGIN}
								className='inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-bold text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50'
							>
								Anmelden
							</Link>
						</div>
					</div>

					<aside className='design-panel grid gap-5 p-5 sm:p-6' data-testid='landing-summary'>
						<div className='rounded-[1.5rem] bg-sidebar-primary p-5 text-sidebar-primary-foreground'>
							<p className='text-sm font-bold text-sidebar-accent'>Ready surface</p>
							<p className='mt-3 max-w-sm text-2xl font-bold leading-tight'>
								Navigation, auth and design language already aligned.
							</p>
						</div>
						<ul className='grid gap-3'>
							{LANDING_FEATURES.map((feature) => (
								<li
									key={feature}
									className='flex items-start gap-3 text-sm font-semibold text-foreground'
								>
									<CheckCircle2 className='mt-0.5 size-4 shrink-0 text-primary' aria-hidden='true' />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					</aside>
				</section>
			</div>
		</main>
	);
}
