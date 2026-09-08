import { Suspense } from 'react';

import { EventDangerZone } from '@/components/events/event-danger-zone';
import { EventDetailsForm } from '@/components/events/event-details-form';
import { FormBuilder } from '@/components/events/form-builder';
import { Section, SectionDescription, SectionHeader, SectionHeading, SectionTitle } from '@/components/layout/section';
import { CardSkeleton } from '@/components/ui/skeleton';
import { loadEvent, loadEventFormFields } from '@/lib/events/event-page-data';

type Params = Promise<{ eventId: string }>;

async function DetailsPanel({ params }: { params: Params }) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);

	return <EventDetailsForm event={event} />;
}

async function FormPanel({ params }: { params: Params }) {
	const { eventId } = await params;
	const fields = await loadEventFormFields(eventId);

	return <FormBuilder eventId={eventId} fields={fields} />;
}

async function DangerPanel({ params }: { params: Params }) {
	const { eventId } = await params;
	const { event, membership } = await loadEvent(eventId);

	// the same rule the action enforces; here it only decides what to show
	const canDelete = membership.role === 'owner' || membership.role === 'admin';

	return <EventDangerZone canDelete={canDelete} event={event} />;
}

// the headings never change and ship with the shell; only the forms wait on the record. the column
// is capped: a settings form stretched across a wide screen is a row of very long input fields.
export default function EventSettingsPage({ params }: { params: Params }) {
	return (
		<div className='grid gap-8' data-testid='event-settings-page'>
			<Section>
				<SectionHeader>
					<SectionHeading>
						<SectionTitle>Event-Daten</SectionTitle>
						<SectionDescription>Was deine Gäste auf der Einladung sehen.</SectionDescription>
					</SectionHeading>
				</SectionHeader>
				<Suspense fallback={<CardSkeleton className='h-[32rem]' />}>
					<DetailsPanel params={params} />
				</Suspense>
			</Section>

			<Section>
				<SectionHeader>
					<SectionHeading>
						<SectionTitle>Formular</SectionTitle>
						<SectionDescription>Was du deine Gäste zusätzlich fragst.</SectionDescription>
					</SectionHeading>
				</SectionHeader>
				<Suspense fallback={<CardSkeleton className='h-64' />}>
					<FormPanel params={params} />
				</Suspense>
			</Section>

			<Section>
				<SectionHeader>
					<SectionHeading>
						<SectionTitle>Event beenden</SectionTitle>
						<SectionDescription>Archivieren oder endgültig löschen.</SectionDescription>
					</SectionHeading>
				</SectionHeader>
				<Suspense fallback={<CardSkeleton className='h-40' />}>
					<DangerPanel params={params} />
				</Suspense>
			</Section>
		</div>
	);
}
