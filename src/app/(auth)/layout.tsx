import { type ReactNode } from 'react';

import { Footer } from '@/components/layout/footer';

type AuthLayoutProps = {
	children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className='flex flex-col bg-background text-foreground'>
			<main
				className='flex flex-1 items-center justify-center px-[max(1rem,env(safe-area-inset-left))] py-8 pt-[max(2rem,env(safe-area-inset-top))]'
				data-testid='auth-layout'
			>
				{children}
			</main>
			<Footer />
		</div>
	);
}
