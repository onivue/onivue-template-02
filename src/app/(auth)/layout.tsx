import { type ReactNode } from 'react';

type AuthLayoutProps = {
	children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<main
			className='flex min-h-[calc(100dvh-var(--site-footer-height))] items-center justify-center bg-background px-4 py-8 text-foreground'
			data-testid='auth-layout'
		>
			{children}
		</main>
	);
}
