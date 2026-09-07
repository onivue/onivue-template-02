import { EventDangerZone } from '@/components/events/event-danger-zone';
import { EventDetailsForm } from '@/components/events/event-details-form';
import { FormBuilder } from '@/components/events/form-builder';
import { Section, SectionDescription, SectionHeader, SectionHeading, SectionTitle } from '@/components/layout/section';
import { loadEvent } from '@/lib/events/event-page-data';
import { eventRepository } from '@/lib/events/event-services';

type SettingsPageProps = {
	params: Promise<{ eventId: string }>;
};

export default async function EventSettingsPage({ params }: SettingsPageProps) {
	const { eventId } = await params;
	const { event, membership } = await loadEvent(eventId);
	const fields = await eventRepository.listFormFields(event.id);

	// the same rule the action enforces; here it only decides what to show
	const canDelete = membership.role === 'owner' || membership.role === 'admin';

	return (
		<div className='grid gap-8' data-testid='event-settings-page'>
			<Section>
				<SectionHeader>
					<SectionHeading>
						<SectionTitle>Event-Daten</SectionTitle>
						<SectionDescription>Was deine Gäste auf der Einladung sehen.</SectionDescription>
					</SectionHeading>
				</SectionHeader>
				<EventDetailsForm event={event} />
			</Section>

			<Section>
				<SectionHeader>
					<SectionHeading>
						<SectionTitle>Formular</SectionTitle>
						<SectionDescription>Was du deine Gäste zusätzlich fragst.</SectionDescription>
					</SectionHeading>
				</SectionHeader>
				<FormBuilder eventId={event.id} fields={fields} />
			</Section>

			<Section>
				<SectionHeader>
					<SectionHeading>
						<SectionTitle>Event beenden</SectionTitle>
						<SectionDescription>Archivieren oder endgültig löschen.</SectionDescription>
					</SectionHeading>
				</SectionHeader>
				<EventDangerZone canDelete={canDelete} event={event} />
			</Section>
		</div>
	);
}
