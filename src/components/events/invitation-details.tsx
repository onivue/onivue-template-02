'use client';

import { Check, ExternalLink, Eye, Pencil, RefreshCw, RotateCcw, Trash2, UserPlus, X } from 'lucide-react';
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
	renameGuest,
	resetInvitationViews,
	rotateInvitationToken,
	setInvitationDeadline,
} from '@/lib/events/invitation-actions';

type InvitationDetailsProps = {
	eventId: string;
	invitation: InvitationRecord;
	onRemoveGuest: (guestId: string) => void;
	onRemoveInvitation: (invitationId: string) => void;
};

// everything a host needs rarely: replacing a link, granting a later deadline, adding, renaming or
// removing a person. it lives behind a disclosure so the everyday view stays a list of names.
// removals are handed up: the list owns the rows and is the only place that can drop one at once.
// the deadline is a draft like the rest of the app's forms — it only writes once "Frist speichern"
// is clicked, so an in-progress pick (a day with no time yet) is never what ends up stored.
export function InvitationDetails({ eventId, invitation, onRemoveGuest, onRemoveInvitation }: InvitationDetailsProps) {
	const [isAddingGuest, setIsAddingGuest] = useState(false);
	const [newGuest, setNewGuest] = useState('');
	const [renaming, setRenaming] = useState<null | string>(null);
	const [renameValue, setRenameValue] = useState('');
	const [deadline, setDeadline] = useState(toBerlinInputValue(invitation.responseDeadline, 'end-of-day'));
	const [confirming, setConfirming] = useState<null | string>(null);

	const asks = (key: string) => confirming === key;

	const addNewGuest = () =>
		void report(addGuest(eventId, invitation.id, newGuest), 'Person ergänzt.').then(() => setNewGuest(''));

	const startRenaming = (guestId: string, currentName: string) => {
		setRenaming(guestId);
		setRenameValue(currentName);
	};

	const confirmRenaming = (guestId: string) =>
		void report(renameGuest(eventId, guestId, renameValue), 'Person umbenannt.').then(() => setRenaming(null));

	return (
		<div className='design-form rounded-2xl bg-muted/40 p-4 @lg:p-5' data-testid={`details-${invitation.id}`}>
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

				{/* one row per person, spaced rather than ruled off — the panel around the whole
				    accordion already sets this apart from the rest of the list */}
				<ul className='grid gap-1'>
					{invitation.guests.map((guest) => (
						<li className='flex items-center justify-between gap-3 py-1.5 text-sm' key={guest.id}>
							{renaming === guest.id ? (
								<>
									<Input
										className='h-9'
										data-testid={`rename-guest-${guest.id}`}
										ref={(node) => node?.focus()}
										onChange={(nativeEvent) => setRenameValue(nativeEvent.target.value)}
										onKeyDown={(nativeEvent) => {
											if (nativeEvent.key === 'Enter' && renameValue.trim()) {
												nativeEvent.preventDefault();
												confirmRenaming(guest.id);
											}

											if (nativeEvent.key === 'Escape') {
												setRenaming(null);
											}
										}}
										value={renameValue}
									/>
									<div className='flex shrink-0 items-center gap-1'>
										<Button
											aria-label='Umbenennen speichern'
											data-testid={`confirm-rename-${guest.id}`}
											disabled={!renameValue.trim()}
											onClick={() => confirmRenaming(guest.id)}
											size='icon-sm'
											variant='ghost'
										>
											<Check />
										</Button>
										<Button
											aria-label='Umbenennen abbrechen'
											data-testid={`cancel-rename-${guest.id}`}
											onClick={() => setRenaming(null)}
											size='icon-sm'
											variant='ghost'
										>
											<X />
										</Button>
									</div>
								</>
							) : (
								<>
									<span className='min-w-0'>
										{guestFullName(guest)}
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
											onClick={() => {
												setConfirming(null);
												onRemoveGuest(guest.id);
											}}
											size='xs'
											variant='destructive'
										>
											Endgültig entfernen?
										</Button>
									) : (
										<div className='flex shrink-0 items-center gap-1'>
											<Button
												aria-label={`${guestFullName(guest)} umbenennen`}
												data-testid={`rename-guest-toggle-${guest.id}`}
												onClick={() => startRenaming(guest.id, guestFullName(guest))}
												size='icon-sm'
												variant='ghost'
											>
												<Pencil />
											</Button>
											<Button
												aria-label={`${guestFullName(guest)} entfernen`}
												data-testid={`remove-guest-${guest.id}`}
												onClick={() => setConfirming(guest.id)}
												size='icon-sm'
												variant='ghost'
											>
												<X />
											</Button>
										</div>
									)}
								</>
							)}
						</li>
					))}
				</ul>

				{isAddingGuest ? (
					// stacked on a phone: side by side, the button's fixed width left the name field
					// too narrow to read what was being typed into it
					<div className='grid gap-2 @lg:flex @lg:items-center'>
						<Input
							data-testid={`add-guest-${invitation.id}`}
							ref={(node) => node?.focus()}
							onChange={(nativeEvent) => setNewGuest(nativeEvent.target.value)}
							onKeyDown={(nativeEvent) => {
								if (nativeEvent.key === 'Enter' && newGuest.trim()) {
									nativeEvent.preventDefault();
									addNewGuest();
								}

								if (nativeEvent.key === 'Escape') {
									setIsAddingGuest(false);
									setNewGuest('');
								}
							}}
							placeholder='Vor- und Nachname'
							value={newGuest}
						/>
						<div className='flex gap-1 @lg:shrink-0'>
							<Button
								className='@lg:shrink-0'
								disabled={!newGuest.trim()}
								onClick={addNewGuest}
								size='xl'
								variant='outline'
							>
								<UserPlus /> Hinzufügen
							</Button>
							<Button
								aria-label='Abbrechen'
								onClick={() => {
									setIsAddingGuest(false);
									setNewGuest('');
								}}
								size='xl'
								variant='ghost'
							>
								<X />
							</Button>
						</div>
					</div>
				) : (
					<Button
						className='w-fit'
						data-testid={`add-guest-toggle-${invitation.id}`}
						onClick={() => setIsAddingGuest(true)}
						size='sm'
						variant='outline'
					>
						<UserPlus /> Weitere Person hinzufügen
					</Button>
				)}
			</section>

			<section className='design-field'>
				<span className='design-label'>Eigene Frist</span>
				<DateTimePicker
					data-testid={`deadline-${invitation.id}`}
					label='Eigene Frist'
					onChange={setDeadline}
					placeholder='Keine eigene Frist'
					value={deadline}
				/>
				<span className='text-xs text-ink-soft'>
					Leer lassen, damit die Frist des Events gilt. Eine eigene Frist übersteuert sie.
				</span>
				<Button
					className='w-fit'
					data-testid={`save-deadline-${invitation.id}`}
					onClick={() =>
						void report(setInvitationDeadline(eventId, invitation.id, deadline), 'Frist gespeichert.')
					}
					size='sm'
					variant='outline'
				>
					Frist speichern
				</Button>
			</section>

			<div className='flex flex-wrap gap-1'>
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

				{/* on its own line on a phone: the confirm labels are far longer than the resting ones,
				    and sharing a wrapping line let one of them reshuffle the other two */}
				<Button
					className='ms-auto @max-lg:w-full @max-lg:justify-start'
					data-testid={`delete-invitation-${invitation.id}`}
					onClick={() =>
						asks(invitation.id) ? onRemoveInvitation(invitation.id) : setConfirming(invitation.id)
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
