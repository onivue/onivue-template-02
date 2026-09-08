'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import type { EventRecord } from '@/lib/events/event-repository';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_ROUTES } from '@/config/routes';
import { deleteEvent, setEventStatus } from '@/lib/events/event-actions';

type EventDangerZoneProps = {
	canDelete: boolean;
	event: EventRecord;
};

// the two ways an event ends: quietly, or for good. kept apart from the everyday settings so a
// misplaced click cannot reach them.
export function EventDangerZone({ canDelete, event }: EventDangerZoneProps) {
	const router = useRouter();
	const [confirmation, setConfirmation] = useState('');

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
		<div className='grid gap-4' data-testid='event-danger-zone'>
			<section className='design-panel grid gap-3 p-5 sm:p-6'>
				<h3 className='design-label'>Archiv</h3>
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

			<section className='design-panel grid gap-3 border-destructive/40 p-5 sm:p-6'>
				<h3 className='design-label'>Löschen</h3>
				<p className='text-sm text-ink-soft'>
					Löschen ist endgültig: Gästeliste, Antworten und Verlauf sind sofort weg, die verschickten Links
					tot. Es gibt keine Wiederherstellung. Tippe zur Bestätigung den Titel des Events ein.
				</p>
				{canDelete ? (
					<div className='flex flex-wrap gap-2'>
						<Input
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
