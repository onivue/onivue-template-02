import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { AuthStatus, AuthStatusSkeleton } from '@/components/auth/auth-status';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';

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
		<div className='flex flex-col bg-background text-foreground'>
			<main
				className='grid flex-1 grid-rows-[1fr] px-[clamp(1rem,3vw,1.5rem)] pt-[max(1rem,env(safe-area-inset-top))] pb-6'
				data-testid='landing-page'
			>
				<div className='mx-auto grid w-full max-w-6xl grid-rows-[auto_1fr] gap-[clamp(2rem,5vw,4rem)]'>
					<header className='flex min-h-12 items-center justify-between gap-4' data-testid='landing-header'>
						<Link
							href={APP_ROUTES.LANDING}
							className='rounded-sm text-lg font-bold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
						>
							onivue
						</Link>
						<Suspense fallback={<AuthStatusSkeleton placement='inline' />}>
							<AuthStatus placement='inline' />
						</Suspense>
					</header>

					<section
						className='grid content-center items-center gap-10 pb-[clamp(2rem,5vw,4rem)] md:grid-cols-[1.05fr_0.95fr]'
						data-testid='landing-hero'
					>
						<div className='flex max-w-3xl flex-col gap-6'>
							<span className='design-section-label w-fit px-3 py-1.5'>Product template</span>
							<div className='flex flex-col gap-4'>
								<h1 className='design-page-title max-w-4xl'>
									Build focused apps with a calm interface.
								</h1>
								<p className='design-page-description max-w-xl text-base'>
									onivue combines a restrained product shell, mobile-first navigation, and auth-ready
									screens into one reusable Next.js starter.
								</p>
							</div>
							<div className='flex flex-col gap-3 sm:flex-row'>
								<Button
									variant='strong'
									size='xl'
									nativeButton={false}
									render={<Link href={APP_ROUTES.REGISTER} />}
								>
									<span>Account erstellen</span>
									<ArrowRight data-icon='inline-end' aria-hidden='true' />
								</Button>
								<Button
									variant='outline'
									size='xl'
									nativeButton={false}
									render={<Link href={APP_ROUTES.LOGIN} />}
								>
									Anmelden
								</Button>
							</div>
						</div>

						<aside className='design-panel grid gap-5 p-5 sm:p-6' data-testid='landing-summary'>
							<div className='rounded-2xl bg-sidebar-primary p-5 text-sidebar-primary-foreground'>
								<p className='text-sm font-bold text-sidebar-accent'>Ready surface</p>
								<p className='mt-3 max-w-sm text-2xl leading-tight font-bold'>
									Navigation, auth and design language already aligned.
								</p>
							</div>
							<ul className='grid gap-3'>
								{LANDING_FEATURES.map((feature) => (
									<li
										key={feature}
										className='flex items-start gap-3 text-sm font-semibold text-foreground'
									>
										<CheckCircle2
											className='mt-0.5 size-4 shrink-0 text-accent-strong'
											aria-hidden='true'
										/>
										<span>{feature}</span>
									</li>
								))}
							</ul>
						</aside>
					</section>
				</div>
			</main>
			<Footer />
		</div>
	);
}
