import { CalendarClock, Download, ListChecks, MapPin, Send, Users } from 'lucide-react';
import Link from 'next/link';

import { ResponseCounts } from '@/components/events/response-counts';
import { Button } from '@/components/ui/button';
import { eventExportPath, eventPath } from '@/config/routes';
import { formatBerlin } from '@/lib/events/berlin-time';
import { loadEvent } from '@/lib/events/event-page-data';
import { eventRepository } from '@/lib/events/event-services';
import { resolveResponseWindow } from '@/lib/events/response-window';

type OverviewPageProps = {
	params: Promise<{ eventId: string }>;
};

type NextStep = {
	href: string;
	label: string;
	text: string;
};

export default async function EventOverviewPage({ params }: OverviewPageProps) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);
	const [counts, fields] = await Promise.all([
		eventRepository.eventCounts(event.id),
		eventRepository.listFormFields(event.id),
	]);

	const window = resolveResponseWindow(
		{ eventDeadline: event.responseDeadline, eventStatus: event.status, invitationDeadline: null },
		new Date()
	);

	// the overview earns its place by saying what is missing, in the order a host would do it
	const steps: NextStep[] = [
		...(event.startsAt
			? []
			: [
					{
						href: eventPath(event.id, 'settings'),
						label: 'Datum eintragen',
						text: 'Das Event hat noch kein Datum.',
					},
				]),
		...(counts.invitations === 0
			? [
					{
						href: eventPath(event.id, 'guests'),
						label: 'Gäste eintragen',
						text: 'Noch keine Einladung angelegt.',
					},
				]
			: []),
		...(counts.invitations > 0 && counts.unsent > 0
			? [
					{
						href: eventPath(event.id, 'guests'),
						label: 'Links verschicken',
						text: `${counts.unsent} Einladung${counts.unsent === 1 ? ' wartet' : 'en warten'} darauf, verschickt zu werden.`,
					},
				]
			: []),
		...(event.responseDeadline
			? []
			: [
					{
						href: eventPath(event.id, 'settings'),
						label: 'Frist setzen',
						text: 'Ohne Frist können Gäste ihre Antwort unbegrenzt ändern.',
					},
				]),
	];

	return (
		<div className='grid gap-4' data-testid='event-overview'>
			<ResponseCounts counts={counts} />

			{steps.length > 0 ? (
				<section className='design-panel grid gap-2 px-4 py-4' data-testid='next-steps'>
					<h2 className='design-label'>Als Nächstes</h2>
					<ul className='grid gap-2'>
						{steps.map((step) => (
							<li className='flex flex-wrap items-center justify-between gap-2 text-sm' key={step.label}>
								<span className='text-ink-soft'>{step.text}</span>
								<Button
									nativeButton={false}
									render={<Link href={step.href} />}
									size='sm'
									variant='outline'
								>
									{step.label}
								</Button>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<section className='design-panel grid gap-3 px-4 py-4'>
				<h2 className='design-label'>Eckdaten</h2>
				<dl className='grid gap-2 text-sm sm:grid-cols-2'>
					<div className='flex items-start gap-2'>
						<CalendarClock aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-ink-soft' />
						<div>
							<dt className='text-ink-soft'>Wann</dt>
							<dd>{event.startsAt ? formatBerlin(event.startsAt) : 'Noch nicht festgelegt'}</dd>
						</div>
					</div>

					<div className='flex items-start gap-2'>
						<MapPin aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-ink-soft' />
						<div>
							<dt className='text-ink-soft'>Wo</dt>
							<dd>{event.location ?? 'Noch nicht festgelegt'}</dd>
						</div>
					</div>

					<div className='flex items-start gap-2'>
						<Send aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-ink-soft' />
						<div>
							<dt className='text-ink-soft'>Antworten</dt>
							<dd data-testid='response-window'>
								{window.open
									? window.closesAt
										? `Offen bis ${formatBerlin(window.closesAt)}`
										: 'Offen, ohne Frist'
									: window.reason === 'archived'
										? 'Geschlossen — das Event ist archiviert'
										: 'Geschlossen — die Frist ist abgelaufen'}
							</dd>
						</div>
					</div>

					<div className='flex items-start gap-2'>
						<ListChecks aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-ink-soft' />
						<div>
							<dt className='text-ink-soft'>Formular</dt>
							<dd>
								{fields.length === 0
									? 'Nur Zu- und Absage'
									: `${fields.length} zusätzliche Frage${fields.length === 1 ? '' : 'n'}`}
							</dd>
						</div>
					</div>
				</dl>
			</section>

			<div className='flex flex-wrap gap-2'>
				<Button
					nativeButton={false}
					render={<Link href={eventPath(event.id, 'guests')} />}
					size='xl'
					variant='strong'
				>
					<Users data-icon='inline-start' /> Gäste verwalten
				</Button>
				<Button
					data-testid='event-export'
					disabled={counts.invitations === 0}
					nativeButton={false}
					render={
						<a aria-label='Gästeliste als CSV herunterladen' download href={eventExportPath(event.id)} />
					}
					size='xl'
					variant='outline'
				>
					<Download data-icon='inline-start' /> CSV-Export
				</Button>
			</div>
		</div>
	);
}
