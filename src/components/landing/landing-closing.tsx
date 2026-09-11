import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';

export function LandingClosing() {
	return (
		<section
			className='grid gap-6 rounded-3xl bg-sidebar-primary p-6 text-sidebar-primary-foreground sm:p-10'
			data-testid='landing-closing'
		>
			<div className='grid max-w-2xl gap-3'>
				<h2 className='text-3xl leading-tight font-bold text-balance sm:text-4xl'>
					Das nächste Fest steht an.
				</h2>
				<p className='text-base text-sidebar-primary-foreground/75'>
					Account erstellen, Event anlegen, Gästeliste einfügen — die ersten Einladungen sind in ein paar
					Minuten unterwegs.
				</p>
			</div>

			<div className='flex flex-col gap-3 sm:flex-row'>
				<Button
					variant='default'
					size='xl'
					className='rounded-full font-bold'
					nativeButton={false}
					render={<Link href={APP_ROUTES.REGISTER} />}
					data-testid='closing-register-link'
				>
					<span>Account erstellen</span>
					<ArrowRight data-icon='inline-end' aria-hidden='true' />
				</Button>
				<Button
					variant='ghost'
					size='xl'
					className='text-sidebar-primary-foreground hover:bg-sidebar-accent/15 hover:text-sidebar-primary-foreground'
					nativeButton={false}
					render={<Link href={APP_ROUTES.LOGIN} />}
					data-testid='closing-login-link'
				>
					Ich habe schon ein Konto
				</Button>
			</div>
		</section>
	);
}
