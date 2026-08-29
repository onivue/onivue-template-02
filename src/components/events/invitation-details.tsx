'use client';

import { ExternalLink, RefreshCw, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';

import type { InvitationRecord } from '@/lib/events/event-repository';

import { guestFullName } from '@/components/events/guest-filters';
import { report } from '@/components/events/report-result';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { invitationPath } from '@/config/routes';
import { formatBerlinShort, toBerlinInputValue } from '@/lib/events/berlin-time';
import {
	addGuest,
	removeGuest,
	removeInvitation,
	rotateInvitationToken,
	setInvitationDeadline,
} from '@/lib/events/invitation-actions';

type InvitationDetailsProps = {
	eventId: string;
	invitation: InvitationRecord;
};

// everything a host needs rarely: replacing a link, granting a later deadline, adding or removing
// a person. it lives behind a disclosure so the everyday view stays a list of names.
export function InvitationDetails({ eventId, invitation }: InvitationDetailsProps) {
	const [newGuest, setNewGuest] = useState('');
	const [confirming, setConfirming] = useState<null | string>(null);

	return (
		<div className='grid gap-4 rounded-2xl bg-muted/40 px-3 py-3' data-testid={`details-${invitation.id}`}>
			<div className='grid gap-2'>
				<span className='design-label'>Personen</span>
				<ul className='grid gap-1'>
					{invitation.guests.map((guest) => (
						<li className='flex items-center justify-between gap-2 text-sm' key={guest.id}>
							<span>
								{guestFullName(guest)}
								{guest.isMainGuest ? <span className='text-ink-soft'> · Hauptperson</span> : null}
								{guest.respondedAt ? (
									<span className='text-ink-soft'>
										{' '}
										· geantwortet {formatBerlinShort(guest.respondedAt)}
									</span>
								) : null}
							</span>
							<Button
								data-testid={`remove-guest-${guest.id}`}
								onClick={() =>
									confirming === guest.id
										? void report(removeGuest(eventId, guest.id), 'Person entfernt.').then(() =>
												setConfirming(null)
											)
										: setConfirming(guest.id)
								}
								size='xs'
								variant={confirming === guest.id ? 'destructive' : 'ghost'}
							>
								<X /> {confirming === guest.id ? 'Endgültig entfernen?' : 'Entfernen'}
							</Button>
						</li>
					))}
				</ul>

				<div className='flex gap-2'>
					<Input
						className='design-input h-9 max-w-56'
						data-testid={`add-guest-${invitation.id}`}
						onChange={(nativeEvent) => setNewGuest(nativeEvent.target.value)}
						placeholder='Vor- und Nachname'
						value={newGuest}
					/>
					<Button
						disabled={!newGuest.trim()}
						onClick={() =>
							void report(addGuest(eventId, invitation.id, newGuest), 'Person ergänzt.').then(() =>
								setNewGuest('')
							)
						}
						size='sm'
						variant='outline'
					>
						<UserPlus /> Hinzufügen
					</Button>
				</div>
			</div>

			<div className='grid gap-1'>
				<span className='design-label'>Eigene Frist</span>
				<Input
					className='design-input h-9 max-w-64'
					data-testid={`deadline-${invitation.id}`}
					defaultValue={toBerlinInputValue(invitation.responseDeadline)}
					onBlur={(nativeEvent) =>
						void report(
							setInvitationDeadline(eventId, invitation.id, nativeEvent.target.value),
							'Frist gespeichert.'
						)
					}
					type='datetime-local'
				/>
				<span className='text-xs text-ink-soft'>
					Leer lassen, damit die Frist des Events gilt. Eine eigene Frist übersteuert sie.
				</span>
			</div>

			<div className='flex flex-wrap gap-2 border-t border-border pt-3'>
				<Button
					nativeButton={false}
					render={
						<a
							aria-label='Einladung ansehen'
							href={invitationPath(invitation.token)}
							rel='noreferrer'
							target='_blank'
						/>
					}
					size='sm'
					variant='ghost'
				>
					<ExternalLink /> Ansehen
				</Button>

				<Button
					data-testid={`rotate-${invitation.id}`}
					onClick={() =>
						confirming === `rotate-${invitation.id}`
							? void report(
									rotateInvitationToken(eventId, invitation.id),
									'Neuer Link erzeugt — der alte funktioniert nicht mehr.'
								).then(() => setConfirming(null))
							: setConfirming(`rotate-${invitation.id}`)
					}
					size='sm'
					variant='ghost'
				>
					<RefreshCw />{' '}
					{confirming === `rotate-${invitation.id}`
						? 'Alten Link wirklich ungültig machen?'
						: 'Link ersetzen'}
				</Button>

				<Button
					data-testid={`delete-invitation-${invitation.id}`}
					onClick={() =>
						confirming === invitation.id
							? void report(removeInvitation(eventId, invitation.id), 'Einladung gelöscht.')
							: setConfirming(invitation.id)
					}
					size='sm'
					variant={confirming === invitation.id ? 'destructive' : 'ghost'}
				>
					<Trash2 /> {confirming === invitation.id ? 'Wirklich löschen?' : 'Einladung löschen'}
				</Button>
			</div>
		</div>
	);
}
