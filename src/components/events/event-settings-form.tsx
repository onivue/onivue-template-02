'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import type { EventRecord } from '@/lib/events/event-repository';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { APP_ROUTES } from '@/config/routes';
import { toBerlinInputValue } from '@/lib/events/berlin-time';
import { deleteEvent, setEventStatus, updateEventDetails } from '@/lib/events/event-actions';

type EventSettingsFormProps = {
	canDelete: boolean;
	event: EventRecord;
};

export function EventSettingsForm({ canDelete, event }: EventSettingsFormProps) {
	const router = useRouter();
	const [details, setDetails] = useState({
		endsAt: toBerlinInputValue(event.endsAt),
		greeting: event.greeting ?? '',
		location: event.location ?? '',
		responseDeadline: toBerlinInputValue(event.responseDeadline),
		startsAt: toBerlinInputValue(event.startsAt),
		title: event.title,
	});
	const [confirmation, setConfirmation] = useState('');
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

	const toggleArchive = async () => {
		const next = event.status === 'archived' ? 'active' : 'archived';
		const result = await setEventStatus(event.id, next);

		if (!result.success) {
			toast.error(result.message);

			return;
		}

		toast.success(next === 'archived' ? 'Event archiviert.' : 'Event wieder aktiv.');
	};

	const remove = async () => {
		const result = await deleteEvent(event.id, confirmation);

		if (!result.success) {
			toast.error(result.message);

			return;
		}

		toast.success('Event gelöscht.');
		router.push(APP_ROUTES.EVENTS);
	};

	return (
		<div className='grid gap-5' data-testid='event-settings'>
			<section className='design-panel grid gap-3 px-4 py-4'>
				<h2 className='design-label'>Eckdaten</h2>

				<label className='grid gap-1'>
					<span className='design-label'>Titel</span>
					<Input
						className='design-input'
						data-testid='settings-title'
						onChange={(nativeEvent) => setDetails({ ...details, title: nativeEvent.target.value })}
						value={details.title}
					/>
				</label>

				<div className='grid gap-3 sm:grid-cols-2'>
					<label className='grid gap-1'>
						<span className='design-label'>Beginn</span>
						<Input
							className='design-input'
							data-testid='settings-starts-at'
							onChange={(nativeEvent) => setDetails({ ...details, startsAt: nativeEvent.target.value })}
							type='datetime-local'
							value={details.startsAt}
						/>
					</label>
					<label className='grid gap-1'>
						<span className='design-label'>Ende (optional)</span>
						<Input
							className='design-input'
							onChange={(nativeEvent) => setDetails({ ...details, endsAt: nativeEvent.target.value })}
							type='datetime-local'
							value={details.endsAt}
						/>
					</label>
				</div>

				<label className='grid gap-1'>
					<span className='design-label'>Ort</span>
					<Input
						className='design-input'
						onChange={(nativeEvent) => setDetails({ ...details, location: nativeEvent.target.value })}
						placeholder='z. B. Gasthaus Krone, Hauptstraße 1'
						value={details.location}
					/>
				</label>

				<label className='grid gap-1'>
					<span className='design-label'>Begrüßungstext</span>
					<Textarea
						onChange={(nativeEvent) => setDetails({ ...details, greeting: nativeEvent.target.value })}
						placeholder='Wir feiern und würden uns freuen, wenn du dabei bist.'
						rows={4}
						value={details.greeting}
					/>
				</label>

				<label className='grid gap-1'>
					<span className='design-label'>Antwort-Frist</span>
					<Input
						className='design-input'
						data-testid='settings-deadline'
						onChange={(nativeEvent) =>
							setDetails({ ...details, responseDeadline: nativeEvent.target.value })
						}
						type='datetime-local'
						value={details.responseDeadline}
					/>
					<span className='text-xs text-ink-soft'>
						Alle Zeiten gelten in deutscher Zeit. Einzelne Einladungen können bei den Gästen eine spätere
						Frist bekommen.
					</span>
				</label>

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

			<section className='design-panel grid gap-3 px-4 py-4'>
				<h2 className='design-label'>Archiv</h2>
				<p className='text-sm text-ink-soft'>
					Archivierte Events verschwinden aus der Liste. Die verschickten Links funktionieren weiter und
					zeigen die abgegebene Antwort — Änderungen sind dann nicht mehr möglich.
				</p>
				<Button
					className='w-fit'
					data-testid='settings-archive'
					onClick={toggleArchive}
					size='xl'
					variant='outline'
				>
					{event.status === 'archived' ? 'Wieder aktiv setzen' : 'Event archivieren'}
				</Button>
			</section>

			<section className='design-panel grid gap-3 border-destructive/40 px-4 py-4'>
				<h2 className='design-label'>Löschen</h2>
				<p className='text-sm text-ink-soft'>
					Löschen ist endgültig: Gästeliste, Antworten und Verlauf sind sofort weg, die verschickten Links
					tot. Es gibt keine Wiederherstellung. Tippe zur Bestätigung den Titel des Events ein.
				</p>
				{canDelete ? (
					<div className='flex flex-wrap gap-2'>
						<Input
							className='design-input sm:max-w-sm'
							data-testid='settings-delete-confirmation'
							onChange={(nativeEvent) => setConfirmation(nativeEvent.target.value)}
							placeholder={event.title}
							value={confirmation}
						/>
						<Button
							data-testid='settings-delete'
							disabled={confirmation.trim() !== event.title}
							onClick={remove}
							size='xl'
							variant='destructive'
						>
							Endgültig löschen
						</Button>
					</div>
				) : (
					<p className='text-sm'>Nur Inhaber und Admins der Organisation dürfen ein Event löschen.</p>
				)}
			</section>
		</div>
	);
}
