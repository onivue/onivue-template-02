'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import type { EventRecord } from '@/lib/events/event-repository';

import { EventDecoration } from '@/components/events/event-decoration';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toBerlinInputValue } from '@/lib/events/berlin-time';
import { updateEventDetails } from '@/lib/events/event-actions';
import { DECORATION_KEYS, DECORATIONS, isDecorationKey } from '@/lib/events/event-decoration';

type EventDetailsFormProps = {
	event: EventRecord;
};

const NO_DECORATION_LABEL = 'Keines';

const DECORATION_LABELS: Record<string, string> = Object.fromEntries(
	DECORATION_KEYS.map((key) => [key, DECORATIONS[key].label])
);

// everything a guest gets to see about the event itself: what it is called, when and where it is,
// and how long the door stays open
export function EventDetailsForm({ event }: EventDetailsFormProps) {
	const [details, setDetails] = useState({
		decoration: event.decoration ?? '',
		endsAt: toBerlinInputValue(event.endsAt),
		greeting: event.greeting ?? '',
		location: event.location ?? '',
		locationAppleMapsUrl: event.locationAppleMapsUrl ?? '',
		locationGoogleMapsUrl: event.locationGoogleMapsUrl ?? '',
		responseDeadline: toBerlinInputValue(event.responseDeadline, 'end-of-day'),
		startsAt: toBerlinInputValue(event.startsAt),
		title: event.title,
	});
	const [isSaving, setIsSaving] = useState(false);

	const save = async () => {
		setIsSaving(true);

		const result = await updateEventDetails(event.id, details);

		setIsSaving(false);

		if (result.success) {
			toast.success('Gespeichert.');

			return;
		}

		toast.error(result.message);
	};

	return (
		<section className='design-panel design-form p-6 sm:p-8' data-testid='event-settings'>
			<label className='design-field'>
				<span className='design-label'>Titel</span>
				<Input
					data-testid='settings-title'
					onChange={(nativeEvent) => setDetails({ ...details, title: nativeEvent.target.value })}
					value={details.title}
				/>
			</label>

			<div className='design-field'>
				<span className='design-label'>Beginn</span>
				<DateTimePicker
					data-testid='settings-starts-at'
					label='Beginn'
					onChange={(value) => setDetails({ ...details, startsAt: value })}
					value={details.startsAt}
				/>
			</div>

			<div className='design-field'>
				<span className='design-label'>Ende (optional)</span>
				<DateTimePicker
					label='Ende'
					onChange={(value) => setDetails({ ...details, endsAt: value })}
					value={details.endsAt}
				/>
			</div>

			<label className='design-field'>
				<span className='design-label'>Ort</span>
				<Textarea
					onChange={(nativeEvent) => setDetails({ ...details, location: nativeEvent.target.value })}
					placeholder='z. B. Gasthaus Krone
Hauptstraße 1
12345 Musterstadt'
					rows={3}
					value={details.location}
				/>
			</label>

			<label className='design-field'>
				<span className='design-label'>Link zu Apple Karten (optional)</span>
				<Input
					data-testid='settings-location-apple-maps-url'
					onChange={(nativeEvent) =>
						setDetails({ ...details, locationAppleMapsUrl: nativeEvent.target.value })
					}
					placeholder='https://maps.apple.com/…'
					type='url'
					value={details.locationAppleMapsUrl}
				/>
			</label>

			<label className='design-field'>
				<span className='design-label'>Link zu Google Maps (optional)</span>
				<Input
					data-testid='settings-location-google-maps-url'
					onChange={(nativeEvent) =>
						setDetails({ ...details, locationGoogleMapsUrl: nativeEvent.target.value })
					}
					placeholder='https://maps.google.com/…'
					type='url'
					value={details.locationGoogleMapsUrl}
				/>
			</label>
			<p className='-mt-4 text-xs text-ink-soft'>
				Der Ort wird für Gäste anklickbar, sobald einer der beiden Links hinterlegt ist.
			</p>

			<label className='design-field'>
				<span className='design-label'>Begrüßungstext</span>
				<Textarea
					onChange={(nativeEvent) => setDetails({ ...details, greeting: nativeEvent.target.value })}
					placeholder='Wir feiern und würden uns freuen, wenn du dabei bist.'
					rows={4}
					value={details.greeting}
				/>
			</label>

			<div className='design-field'>
				<span className='design-label'>3D-Element (optional)</span>
				<Select
					onValueChange={(next) => setDetails({ ...details, decoration: String(next ?? '') })}
					value={details.decoration}
				>
					<SelectTrigger data-testid='settings-decoration' size='field'>
						<SelectValue>
							{(key) => DECORATION_LABELS[String(key ?? '')] ?? NO_DECORATION_LABEL}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value=''>{NO_DECORATION_LABEL}</SelectItem>
						{DECORATION_KEYS.map((key) => (
							<SelectItem key={key} value={key}>
								{DECORATIONS[key].label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className='text-xs text-ink-soft'>
					{isDecorationKey(details.decoration)
						? DECORATIONS[details.decoration].description
						: 'Ohne Auswahl bleibt die Einladung schlicht.'}
				</span>
			</div>

			{isDecorationKey(details.decoration) ? (
				<div
					className='grid justify-items-center rounded-3xl bg-muted/50 py-2'
					data-testid='decoration-preview'
				>
					<EventDecoration className='max-w-xs' decoration={details.decoration} />
				</div>
			) : null}

			<div className='design-field'>
				<span className='design-label'>Antwort-Frist</span>
				<DateTimePicker
					data-testid='settings-deadline'
					label='Antwort-Frist'
					onChange={(value) => setDetails({ ...details, responseDeadline: value })}
					value={details.responseDeadline}
				/>
				<span className='text-xs text-ink-soft'>
					Alle Zeiten gelten in deutscher Zeit. Einzelne Einladungen können bei den Gästen eine spätere Frist
					bekommen.
				</span>
			</div>

			<Button
				className='w-fit'
				data-testid='settings-save'
				disabled={isSaving || !details.title.trim()}
				onClick={save}
				size='xl'
				variant='strong'
			>
				{isSaving ? 'Wird gespeichert …' : 'Speichern'}
			</Button>
		</section>
	);
}
