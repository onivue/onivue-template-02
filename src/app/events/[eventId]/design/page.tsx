import { ThemeEditor } from '@/components/events/theme-editor';
import { loadEvent } from '@/lib/events/event-page-data';
import { eventRepository } from '@/lib/events/event-services';
import { resolveHeaderImageUrl } from '@/lib/events/header-image';
import { isStorageConfigured } from '@/lib/storage/s3-object-storage';

type DesignPageProps = {
	params: Promise<{ eventId: string }>;
};

export default async function EventDesignPage({ params }: DesignPageProps) {
	const { eventId } = await params;
	const { event } = await loadEvent(eventId);
	const [fields, headerImageUrl] = await Promise.all([
		eventRepository.listFormFields(event.id),
		resolveHeaderImageUrl(event.themeHeaderImageKey),
	]);

	return (
		<ThemeEditor
			event={{
				endsAt: event.endsAt,
				greeting: event.greeting,
				location: event.location,
				startsAt: event.startsAt,
				title: event.title,
			}}
			eventId={event.id}
			headerImageUrl={headerImageUrl}
			isStorageConfigured={isStorageConfigured}
			fields={fields.map((field) => ({
				helpText: field.helpText,
				id: field.id,
				label: field.label,
				onlyWhenAttending: field.onlyWhenAttending,
				options: field.options,
				required: field.required,
				retiredAt: field.retiredAt,
				scope: field.scope,
				type: field.type,
			}))}
			theme={{
				themeAccent: event.themeAccent,
				themeFont: event.themeFont,
				themeHeaderImageKey: event.themeHeaderImageKey,
				themeMode: event.themeMode,
			}}
		/>
	);
}
