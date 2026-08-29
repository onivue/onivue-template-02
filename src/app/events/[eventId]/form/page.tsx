import { FormBuilder } from '@/components/events/form-builder';
import { loadEvent } from '@/lib/events/event-page-data';
import { eventRepository } from '@/lib/events/event-services';

type FormPageProps = {
	params: Promise<{ eventId: string }>;
};

export default async function EventFormPage({ params }: FormPageProps) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);
	const fields = await eventRepository.listFormFields(event.id);

	return <FormBuilder eventId={event.id} fields={fields} />;
}
