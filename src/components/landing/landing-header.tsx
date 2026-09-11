import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { APP_ROUTES } from '@/config/routes';

// the landing page is guest-only, so its header carries the two auth actions instead of the
// account control every signed-in shell shows
export function LandingHeader() {
	return (
		<header className='flex min-h-12 items-center justify-between gap-3' data-testid='landing-header'>
			<Link
				href={APP_ROUTES.HOME}
				className='rounded-sm text-lg font-bold text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
				data-testid='landing-logo'
			>
				{APP_CONFIG.app.name}
			</Link>

			<nav className='flex items-center gap-2' aria-label='Konto'>
				<Button
					variant='ghost'
					size='xl'
					nativeButton={false}
					render={<Link href={APP_ROUTES.LOGIN} />}
					data-testid='landing-login-link'
				>
					Anmelden
				</Button>
				<Button
					variant='strong'
					size='xl'
					className='hidden sm:inline-flex'
					nativeButton={false}
					render={<Link href={APP_ROUTES.REGISTER} />}
					data-testid='landing-register-link'
				>
					Account erstellen
				</Button>
			</nav>
		</header>
	);
}
