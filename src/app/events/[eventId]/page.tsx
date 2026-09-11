import { CalendarClock, CalendarPlus, Download, ListChecks, MapPin, Send } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { BulkInviteForm } from '@/components/events/bulk-invite-form';
import { EventLocationCard } from '@/components/events/event-location-card';
import { GuestTable } from '@/components/events/guest-table';
import { ResponseCounts } from '@/components/events/response-counts';
import { ResponseWindowStatus } from '@/components/events/response-window-status';
import { Section, SectionDescription, SectionHeader, SectionHeading, SectionTitle } from '@/components/layout/section';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { eventCalendarPath, eventExportPath, eventPath } from '@/config/routes';
import { formatBerlin } from '@/lib/events/berlin-time';
import { hasAddress, toEventAddress } from '@/lib/events/event-location';
import { loadEvent, loadEventFormFields, loadEventInvitations } from '@/lib/events/event-page-data';
import { countGuests, countInvitations } from '@/lib/events/invitation-counts';

type Params = Promise<{ eventId: string }>;

function Fact({ children, icon: Icon, label }: { children: React.ReactNode; icon: typeof MapPin; label: string }) {
	return (
		<div className='flex items-start gap-2.5'>
			<Icon aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-ink-soft' />
			<div className='min-w-0'>
				<dt className='text-xs text-ink-soft'>{label}</dt>
				<dd className='mt-0.5'>{children}</dd>
			</div>
		</div>
	);
}

// counted from the guest list this page loads anyway, rather than by a query of its own
async function EventCountsPanel({ params }: { params: Params }) {
	const { eventId } = await params;
	const invitations = await loadEventInvitations(eventId);

	return <ResponseCounts counts={countInvitations(invitations)} />;
}

async function EventFacts({ params }: { params: Params }) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);
	const fields = await loadEventFormFields(eventId);
	const address = toEventAddress(event);

	return (
		<section className='design-panel grid gap-4 p-5 sm:p-6'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h2 className='design-label'>Eckdaten</h2>
				<Button
					data-testid='edit-event-details'
					nativeButton={false}
					render={<Link href={eventPath(event.id, 'settings')} />}
					size='sm'
					variant='ghost'
				>
					Bearbeiten
				</Button>
			</div>

			{/* one fact per row: an address runs to several lines, so columns would tear it apart */}
			<dl className='grid gap-4 text-sm'>
				<Fact icon={CalendarClock} label='Wann'>
					{event.startsAt ? formatBerlin(event.startsAt) : 'Noch nicht festgelegt'}
					{event.startsAt && event.endsAt ? (
						<span className='text-ink-soft'> – {formatBerlin(event.endsAt)}</span>
					) : null}
					{event.startsAt ? (
						<a
							className='mt-1 flex w-fit items-center gap-1 text-xs underline-offset-2 hover:underline'
							data-testid='event-add-to-calendar'
							download
							href={eventCalendarPath(event.id)}
						>
							<CalendarPlus aria-hidden='true' className='size-3.5' /> Zum Kalender hinzufügen
						</a>
					) : null}
				</Fact>

				<Fact icon={MapPin} label='Wo'>
					{hasAddress(address) ? (
						<EventLocationCard address={address} className='mt-1' />
					) : (
						'Noch nicht festgelegt'
					)}
				</Fact>

				<Fact icon={Send} label='Antworten'>
					<ResponseWindowStatus
						input={{
							eventDeadline: event.responseDeadline,
							eventStatus: event.status,
							invitationDeadline: null,
						}}
					/>
				</Fact>

				<Fact icon={ListChecks} label='Formular'>
					{fields.length === 0
						? 'Nur Zu- und Absage'
						: `${fields.length} zusätzliche Frage${fields.length === 1 ? '' : 'n'}`}
				</Fact>
			</dl>
		</section>
	);
}

async function EventGuests({ params }: { params: Params }) {
	const { eventId } = await params;
	const invitations = await loadEventInvitations(eventId);
	const counts = countInvitations(invitations);

	return (
		<Section>
			<SectionHeader>
				<SectionHeading>
					<SectionTitle>Gäste</SectionTitle>
					<SectionDescription>
						{counts.invitations === 0
							? 'Noch keine Einladungen angelegt.'
							: `${counts.invitations} Einladung${counts.invitations === 1 ? '' : 'en'} · ${countGuests(invitations)} Person${countGuests(invitations) === 1 ? '' : 'en'}`}
					</SectionDescription>
				</SectionHeading>
				<Button
					data-testid='event-export'
					disabled={counts.invitations === 0}
					nativeButton={false}
					render={
						<a aria-label='Gästeliste als CSV herunterladen' download href={eventExportPath(eventId)} />
					}
					size='sm'
					variant='outline'
				>
					<Download data-icon='inline-start' /> CSV-Export
				</Button>
			</SectionHeader>

			<BulkInviteForm defaultOpen={counts.invitations === 0} eventId={eventId} />
			<GuestTable eventId={eventId} invitations={invitations} />
		</Section>
	);
}

// three boundaries, so each part lands with its own query instead of waiting for the slowest
export default function EventOverviewPage({ params }: { params: Params }) {
	return (
		<div className='grid gap-8' data-testid='event-overview'>
			<div className='grid gap-4'>
				<Suspense fallback={<CardSkeleton className='h-40' />}>
					<EventCountsPanel params={params} />
				</Suspense>

				<Suspense fallback={<CardSkeleton className='h-72' />}>
					<EventFacts params={params} />
				</Suspense>
			</div>

			<Suspense fallback={<CardSkeleton className='h-96' />}>
				<EventGuests params={params} />
			</Suspense>
		</div>
	);
}
