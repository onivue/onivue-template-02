import { EventSettingsForm } from '@/components/events/event-settings-form';
import { loadEvent } from '@/lib/events/event-page-data';

type SettingsPageProps = {
	params: Promise<{ eventId: string }>;
};

export default async function EventSettingsPage({ params }: SettingsPageProps) {
	const { eventId } = await params;
	const { event, membership } = await loadEvent(eventId);

	// the same rule the action enforces; here it only decides what to show
	const canDelete = membership.role === 'owner' || membership.role === 'admin';

	return <EventSettingsForm canDelete={canDelete} event={event} />;
}
