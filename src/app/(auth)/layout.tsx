import { type ReactNode } from 'react';

type AuthLayoutProps = {
	children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<main
			className='design-auth-shell flex min-h-[calc(100dvh-var(--site-footer-height))] items-center justify-center px-4 py-8'
			data-testid='auth-layout'
		>
			{children}
		</main>
	);
}
