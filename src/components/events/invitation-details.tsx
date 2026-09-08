'use client';

import { ExternalLink, Eye, RefreshCw, RotateCcw, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';

import type { InvitationRecord } from '@/lib/events/event-repository';

import { guestFullName } from '@/components/events/guest-filters';
import { report } from '@/components/events/report-result';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { invitationPath } from '@/config/routes';
import { formatBerlinShort, toBerlinInputValue } from '@/lib/events/berlin-time';
import {
	addGuest,
	removeGuest,
	removeInvitation,
	resetInvitationViews,
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
	const [deadline, setDeadline] = useState(toBerlinInputValue(invitation.responseDeadline, 'end-of-day'));
	const [confirming, setConfirming] = useState<null | string>(null);

	const asks = (key: string) => confirming === key;

	const addNewGuest = () =>
		void report(addGuest(eventId, invitation.id, newGuest), 'Person ergänzt.').then(() => setNewGuest(''));

	return (
		<div className='design-form rounded-2xl bg-muted/40 p-4 sm:p-5' data-testid={`details-${invitation.id}`}>
			<div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
				<p className='flex items-center gap-1.5 text-xs text-ink-soft' data-testid={`views-${invitation.id}`}>
					<Eye aria-hidden='true' className='size-3.5 shrink-0' />
					{invitation.viewCount === 0
						? 'Noch nicht geöffnet'
						: `${invitation.viewCount}× geöffnet${invitation.lastViewedAt ? `, zuletzt am ${formatBerlinShort(invitation.lastViewedAt)}` : ''}`}
				</p>

				{invitation.viewCount > 0 ? (
					<Button
						data-testid={`reset-views-${invitation.id}`}
						onClick={() =>
							asks(`views-${invitation.id}`)
								? void report(
										resetInvitationViews(eventId, invitation.id),
										'Zähler zurückgesetzt.'
									).then(() => setConfirming(null))
								: setConfirming(`views-${invitation.id}`)
						}
						size='xs'
						variant={asks(`views-${invitation.id}`) ? 'destructive' : 'ghost'}
					>
						<RotateCcw /> {asks(`views-${invitation.id}`) ? 'Wirklich?' : 'Zurücksetzen'}
					</Button>
				) : null}
			</div>

			<section className='design-field'>
				<span className='design-label'>Personen</span>

				{/* a row per person, separated by a rule rather than by the weight of a labelled button
				    beside every name */}
				<ul className='grid divide-y divide-border/60 border-y border-border/60'>
					{invitation.guests.map((guest) => (
						<li className='flex items-center justify-between gap-3 py-2.5 text-sm' key={guest.id}>
							<span className='min-w-0'>
								{guestFullName(guest)}
								{guest.isMainGuest ? <span className='text-ink-soft'> · Hauptperson</span> : null}
								{guest.respondedAt ? (
									<span className='text-ink-soft'>
										{' '}
										· geantwortet {formatBerlinShort(guest.respondedAt)}
									</span>
								) : null}
							</span>

							{asks(guest.id) ? (
								<Button
									data-testid={`remove-guest-${guest.id}`}
									onClick={() =>
										void report(removeGuest(eventId, guest.id), 'Person entfernt.').then(() =>
											setConfirming(null)
										)
									}
									size='xs'
									variant='destructive'
								>
									Endgültig entfernen?
								</Button>
							) : (
								<Button
									aria-label={`${guestFullName(guest)} entfernen`}
									data-testid={`remove-guest-${guest.id}`}
									onClick={() => setConfirming(guest.id)}
									size='icon-sm'
									variant='ghost'
								>
									<X />
								</Button>
							)}
						</li>
					))}
				</ul>

				<div className='flex items-center gap-2'>
					<Input
						data-testid={`add-guest-${invitation.id}`}
						onChange={(nativeEvent) => setNewGuest(nativeEvent.target.value)}
						onKeyDown={(nativeEvent) => {
							if (nativeEvent.key === 'Enter' && newGuest.trim()) {
								nativeEvent.preventDefault();
								addNewGuest();
							}
						}}
						placeholder='Vor- und Nachname'
						value={newGuest}
					/>
					<Button
						className='shrink-0'
						disabled={!newGuest.trim()}
						onClick={addNewGuest}
						size='xl'
						variant='outline'
					>
						<UserPlus /> Hinzufügen
					</Button>
				</div>
			</section>

			<section className='design-field'>
				<span className='design-label'>Eigene Frist</span>
				<DateTimePicker
					data-testid={`deadline-${invitation.id}`}
					label='Eigene Frist'
					onChange={(next) => {
						setDeadline(next);
						void report(setInvitationDeadline(eventId, invitation.id, next), 'Frist gespeichert.');
					}}
					placeholder='Keine eigene Frist'
					value={deadline}
				/>
				<span className='text-xs text-ink-soft'>
					Leer lassen, damit die Frist des Events gilt. Eine eigene Frist übersteuert sie.
				</span>
			</section>

			<div className='flex flex-wrap gap-1 border-t border-border pt-4'>
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
						asks(`rotate-${invitation.id}`)
							? void report(
									rotateInvitationToken(eventId, invitation.id),
									'Neuer Link erzeugt — der alte funktioniert nicht mehr.'
								).then(() => setConfirming(null))
							: setConfirming(`rotate-${invitation.id}`)
					}
					size='sm'
					variant={asks(`rotate-${invitation.id}`) ? 'destructive' : 'ghost'}
				>
					<RefreshCw /> {asks(`rotate-${invitation.id}`) ? 'Alten Link ungültig machen?' : 'Link ersetzen'}
				</Button>

				<Button
					className='ms-auto'
					data-testid={`delete-invitation-${invitation.id}`}
					onClick={() =>
						asks(invitation.id)
							? void report(removeInvitation(eventId, invitation.id), 'Einladung gelöscht.')
							: setConfirming(invitation.id)
					}
					size='sm'
					variant={asks(invitation.id) ? 'destructive' : 'ghost'}
				>
					<Trash2 /> {asks(invitation.id) ? 'Wirklich löschen?' : 'Einladung löschen'}
				</Button>
			</div>
		</div>
	);
}
