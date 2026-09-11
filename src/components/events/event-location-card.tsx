import { ArrowUpRight, Map, MapPin } from 'lucide-react';

import type { EventAddress } from '@/lib/events/event-location';

import { EventLocationMap } from '@/components/events/event-location-map';
import { addressCoordinates, addressLines, appleMapsUrl, googleMapsUrl } from '@/lib/events/event-location';
import { cn } from '@/lib/utils';

type EventLocationCardProps = {
	address: EventAddress;
	className?: string;
};

const OPEN_IN_MAPS_LABEL = 'Mit Karten öffnen';

function MapAppLink({
	href,
	icon: Icon,
	label,
	testId,
}: {
	href: string;
	icon: typeof Map;
	label: string;
	testId: string;
}) {
	return (
		<a
			className='group flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-accent-strong'
			data-testid={testId}
			href={href}
			rel='noopener noreferrer'
			target='_blank'
		>
			<span className='grid size-7 shrink-0 place-items-center rounded-full bg-muted text-ink-soft transition-colors group-hover:bg-lime-glow/25 group-hover:text-accent-strong'>
				<Icon aria-hidden='true' className='size-3.5' />
			</span>
			{label}
			<ArrowUpRight aria-hidden='true' className='size-3.5 text-ink-soft' />
		</a>
	);
}

// the address, the map and the two ways into a maps app. every link is derived from the address
// itself, so a host never pastes one in and a corrected street can never leave a stale pin behind.
export function EventLocationCard({ address, className }: EventLocationCardProps) {
	const lines = addressLines(address);

	if (lines.length === 0) {
		return null;
	}

	const coordinates = addressCoordinates(address);
	const appleUrl = appleMapsUrl(address);
	const googleUrl = googleMapsUrl(address);
	const [headline, ...rest] = lines;

	return (
		<section
			className={cn('overflow-hidden rounded-3xl border border-border bg-surface-elevated', className)}
			data-testid='event-location-card'
		>
			<div className='grid sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]'>
				{coordinates ? (
					<EventLocationMap
						className='h-40 border-b border-border sm:h-full sm:min-h-40 sm:border-r sm:border-b-0'
						latitude={coordinates.latitude}
						longitude={coordinates.longitude}
					/>
				) : null}

				<div className='grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6'>
					<div className='flex items-start gap-2.5'>
						<MapPin aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-ink-soft' />
						<div className='min-w-0'>
							<p className='text-base leading-tight font-bold text-ink'>{headline}</p>
							{rest.map((line) => (
								<p className='text-sm text-ink-soft' key={line}>
									{line}
								</p>
							))}
						</div>
					</div>

					{appleUrl || googleUrl ? (
						<div className='grid gap-2.5 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6'>
							<p className='design-label'>{OPEN_IN_MAPS_LABEL}</p>
							{appleUrl ? (
								<MapAppLink
									href={appleUrl}
									icon={MapPin}
									label='Apple Karten'
									testId='event-location-apple-maps'
								/>
							) : null}
							{googleUrl ? (
								<MapAppLink
									href={googleUrl}
									icon={Map}
									label='Google Maps'
									testId='event-location-google-maps'
								/>
							) : null}
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
}
