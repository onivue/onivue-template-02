import Link from 'next/link';

import { settingsProfilePath, settingsSecurityPath } from '@/config/routes';
import { cn } from '@/lib/utils';

type SettingsSection = 'profile' | 'security';

type SettingsHeaderProps = {
	description: string;
	section: SettingsSection;
	title: string;
};

const SETTINGS_SECTIONS = [
	{ href: settingsProfilePath(), label: 'Profil', section: 'profile' },
	{ href: settingsSecurityPath(), label: 'Sicherheit', section: 'security' },
] as const satisfies readonly { href: string; label: string; section: SettingsSection }[];

export function SettingsHeader({ description, section, title }: SettingsHeaderProps) {
	return (
		<header className='grid gap-5'>
			<div className='grid gap-2'>
				<p className='design-section-label w-fit px-3 py-1.5'>Settings</p>
				<h1 className='design-page-title text-[clamp(2rem,5vw,3.5rem)]'>{title}</h1>
				<p className='design-page-description'>{description}</p>
			</div>
			<nav aria-label='Settings-Bereiche' className='grid grid-cols-2 gap-2' data-testid='settings-navigation'>
				{SETTINGS_SECTIONS.map((item) => {
					const isActive = item.section === section;

					return (
						<Link
							aria-current={isActive ? 'page' : undefined}
							className={cn(
								'flex h-12 items-center justify-center rounded-full border px-4 text-sm font-bold transition-colors',
								isActive
									? 'border-action-strong bg-action-strong text-action-strong-foreground'
									: 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
							)}
							href={item.href}
							key={item.section}
						>
							{item.label}
						</Link>
					);
				})}
			</nav>
		</header>
	);
}
