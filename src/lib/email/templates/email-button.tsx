import type { ReactNode } from 'react';

import { Button } from '@react-email/components';

type EmailButtonProps = {
	children: ReactNode;
	href: string;
};

// mirrors the app's variant='strong' size='xl' button: dark pill, lime label
export function EmailButton({ children, href }: EmailButtonProps) {
	return (
		<Button
			href={href}
			className='box-border block rounded-full bg-ink px-7 py-4 text-center text-[15px] font-bold text-lime no-underline'
		>
			{children}
		</Button>
	);
}
