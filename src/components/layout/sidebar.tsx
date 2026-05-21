'use client';

import { MessageSquare, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

type SidebarProps = {
	className?: string;
	onNavigate?: () => void;
};

type NavigationItem = {
	href: string;
	icon: LucideIcon;
	label: string;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
	{
		href: '/chat',
		icon: MessageSquare,
		label: 'Chat',
	},
];

export function Sidebar({ className, onNavigate }: SidebarProps) {
	const pathname = usePathname();

	return (
		<aside
			className={cn('rounded-2xl bg-sidebar-primary p-2 text-sidebar-primary-foreground shadow-sm', className)}
			aria-label='Seitennavigation'
			data-testid='sidebar'
		>
			<nav className='grid gap-2'>
				{NAVIGATION_ITEMS.map((item) => {
					const Icon = item.icon;
					const isActive = pathname === item.href;

					return (
						<Link
							key={item.label}
							href={item.href}
							onClick={onNavigate}
							className={cn(
								'flex h-8 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
								isActive
									? 'bg-sidebar-primary-foreground text-sidebar-primary'
									: 'text-sidebar-primary-foreground/70 hover:bg-sidebar-primary-foreground/10 hover:text-sidebar-primary-foreground'
							)}
							aria-current={isActive ? 'page' : undefined}
							data-testid='sidebar-chat-link'
						>
							<Icon className='size-3.5' aria-hidden='true' />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
