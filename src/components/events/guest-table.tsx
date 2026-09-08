'use client';

import { ChevronDown, Copy, Eye, Reply, Search, Send } from 'lucide-react';
import { startTransition, useOptimistic, useState } from 'react';
import { toast } from 'sonner';

import type { InvitationRecord } from '@/lib/events/event-repository';

import {
	EMPTY_FILTER,
	filterInvitations,
	type GuestFilter,
	guestFullName,
	isFilterActive,
} from '@/components/events/guest-filters';
import { InvitationDetails } from '@/components/events/invitation-details';
import { report } from '@/components/events/report-result';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { invitationPath } from '@/config/routes';
import { formatBerlinShort } from '@/lib/events/berlin-time';
import { removeGuest, removeInvitation, setInvitationSent } from '@/lib/events/invitation-actions';
import { cn } from '@/lib/utils';

type GuestTableProps = {
	eventId: string;
	invitations: InvitationRecord[];
};

type GuestListPatch =
	| { guestId: string; kind: 'guest-removed' }
	| { invitationId: string; kind: 'invitation-removed' }
	| { invitationId: string; kind: 'sent'; sentAt: Date | null };

// status lives in the colour of the name itself: at fifty guests, a badge next to every name is
// noise, and the name is what the host is scanning for
const RESPONSE_STYLE = {
	accepted: 'bg-accent-strong/15 text-accent-strong',
	declined: 'bg-foreground/10 text-ink-soft line-through',
	open: 'bg-muted text-ink-soft',
} as const;

const RESPONSE_TITLE = {
	accepted: 'zugesagt',
	declined: 'abgesagt',
	open: 'noch offen',
} as const;

const RESPONSE_FILTERS = [
	{ label: 'Alle', value: 'all' },
	{ label: 'Zugesagt', value: 'accepted' },
	{ label: 'Offen', value: 'open' },
	{ label: 'Abgesagt', value: 'declined' },
] as const;

const SENT_FILTERS = [
	{ label: 'Egal', value: 'all' },
	{ label: 'Versendet', value: 'sent' },
	{ label: 'Offen', value: 'unsent' },
] as const;

// the link has to be absolute to be pasted into a chat, and only the browser knows the origin
async function copyLink(token: string): Promise<void> {
	await navigator.clipboard.writeText(new URL(invitationPath(token), globalThis.location.origin).toString());
	toast.success('Link kopiert.');
}

// each group is its own segmented control, so two filters side by side never read as one long row.
// the icon names the group, not the options — repeating one per pill was noise.
function FilterPills<T extends string>({
	icon: Icon,
	label,
	name,
	onChange,
	options,
	value,
}: {
	icon: typeof Reply;
	label: string;
	name: string;
	onChange: (value: T) => void;
	options: readonly { label: string; value: T }[];
	value: T;
}) {
	return (
		// the label moves above its pills while the column is narrow: beside them it took some
		// eighty pixels, which was exactly what pushed the last option onto a second line
		<div className='grid gap-1.5 @lg:flex @lg:items-center @lg:gap-2'>
			<span className='flex items-center gap-1.5 text-xs text-ink-soft'>
				<Icon aria-hidden='true' className='size-3.5 shrink-0' />
				{label}
			</span>
			<div className='flex flex-wrap gap-1 rounded-full bg-muted p-1'>
				{options.map((option) => (
					<Button
						// a near-white "selected" tint is not a selection; the chosen filter takes the ink
						// pill — and keeps it on hover, or the label disappears into its own background
						className={cn(
							'h-9 @lg:h-7',
							value === option.value
								? 'bg-ink font-bold text-background hover:bg-ink/90 hover:text-background'
								: 'text-ink-soft hover:bg-surface-elevated hover:text-ink'
						)}
						data-testid={`filter-${name}-${option.value}`}
						key={option.value}
						onClick={() => onChange(option.value)}
						size='sm'
						variant='ghost'
					>
						{option.label}
					</Button>
				))}
			</div>
		</div>
	);
}

// the host has already decided by the time they confirm, so the list changes at once and the server
// catches up. a failed write is dropped by react and explained by the toast.
function applyPatch(invitations: InvitationRecord[], patch: GuestListPatch): InvitationRecord[] {
	if (patch.kind === 'invitation-removed') {
		return invitations.filter((invitation) => invitation.id !== patch.invitationId);
	}

	if (patch.kind === 'guest-removed') {
		return invitations.map((invitation) => ({
			...invitation,
			guests: invitation.guests.filter((guest) => guest.id !== patch.guestId),
		}));
	}

	return invitations.map((invitation) =>
		invitation.id === patch.invitationId ? { ...invitation, sentAt: patch.sentAt } : invitation
	);
}

// quiet on purpose: an unopened invitation should read as "nothing yet", not as a warning
function InvitationViews({ count, lastViewedAt }: { count: number; lastViewedAt: Date | null }) {
	return (
		<span
			className={cn(
				'flex items-center gap-1 px-1.5 text-xs tabular-nums',
				count > 0 ? 'text-ink-soft' : 'text-ink-soft/45'
			)}
			data-testid='invitation-views'
			title={
				lastViewedAt ? `${count}× geöffnet, zuletzt ${formatBerlinShort(lastViewedAt)}` : 'Noch nicht geöffnet'
			}
		>
			<Eye aria-hidden='true' className='size-3.5 shrink-0' />
			{count}
			<span className='sr-only'>mal geöffnet</span>
		</span>
	);
}

export function GuestTable({ eventId, invitations }: GuestTableProps) {
	const [filter, setFilter] = useState<GuestFilter>(EMPTY_FILTER);
	const [expanded, setExpanded] = useState<null | string>(null);
	const [optimistic, patchList] = useOptimistic(invitations, applyPatch);

	const visible = filterInvitations(optimistic, filter);
	const unsentCount = optimistic.filter((invitation) => !invitation.sentAt).length;

	const toggleSent = (invitationId: string, sent: boolean) => {
		startTransition(async () => {
			patchList({ invitationId, kind: 'sent', sentAt: sent ? new Date() : null });

			await report(
				setInvitationSent(eventId, invitationId, sent),
				sent ? 'Als versendet markiert.' : 'Als offen markiert.'
			);
		});
	};

	const deleteInvitation = (invitationId: string) => {
		setExpanded(null);

		startTransition(async () => {
			patchList({ invitationId, kind: 'invitation-removed' });

			await report(removeInvitation(eventId, invitationId), 'Einladung gelöscht.');
		});
	};

	const deleteGuest = (guestId: string) => {
		startTransition(async () => {
			patchList({ guestId, kind: 'guest-removed' });

			await report(removeGuest(eventId, guestId), 'Person entfernt.');
		});
	};

	if (optimistic.length === 0) {
		return (
			<p className='design-panel px-6 py-10 text-center text-sm text-ink-soft' data-testid='guests-empty'>
				Noch keine Einladungen. Füge oben Zeilen ein — eine Zeile ist eine Einladung.
			</p>
		);
	}

	return (
		<div className='grid gap-3' data-testid='guest-table'>
			{/* one card: the filters are the head of this list, not a panel of their own */}
			<div className='design-panel @container overflow-hidden'>
				<div className='grid gap-3 p-5 @lg:p-6'>
					<label className='relative block'>
						<span className='sr-only'>Gäste durchsuchen</span>
						<Search
							aria-hidden='true'
							className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft'
						/>
						<Input
							className='pl-9'
							data-testid='guest-search'
							onChange={(nativeEvent) => setFilter({ ...filter, search: nativeEvent.target.value })}
							placeholder='Nach Name, E-Mail oder Notiz suchen'
							type='search'
							value={filter.search}
						/>
					</label>

					<div className='flex flex-wrap items-center gap-x-8 gap-y-4'>
						<FilterPills
							icon={Reply}
							label='Antwort'
							name='response'
							onChange={(response) => setFilter({ ...filter, response })}
							options={RESPONSE_FILTERS}
							value={filter.response}
						/>

						<FilterPills
							icon={Send}
							label='Versand'
							name='sent'
							onChange={(sent) => setFilter({ ...filter, sent })}
							options={SENT_FILTERS}
							value={filter.sent}
						/>
					</div>
				</div>

				{visible.length === 0 ? (
					<p
						className='border-t border-border px-6 py-10 text-center text-sm text-ink-soft'
						data-testid='guests-filtered-empty'
					>
						Keine Einladung passt zu diesem Filter.{' '}
						<Button onClick={() => setFilter(EMPTY_FILTER)} size='sm' variant='link'>
							Filter zurücksetzen
						</Button>
					</p>
				) : (
					<ul className='divide-y divide-border border-t border-border' data-testid='invitation-list'>
						{visible.map((invitation) => (
							<li
								className='grid gap-3 px-5 py-4'
								data-testid={`invitation-${invitation.id}`}
								key={invitation.id}
							>
								{/* the names own their line and the actions own theirs until the column can hold both.
								    measured against the panel, not the viewport: the sidebar appears at md and makes this
								    column narrower again, and sharing a line put the actions beside a short name and
								    below a long one, so no two rows agreed on a shape. */}
								<div className='grid gap-2 @lg:flex @lg:flex-wrap @lg:items-center @lg:justify-between @lg:gap-3'>
									<div className='flex min-w-0 flex-wrap items-center gap-1.5'>
										{invitation.guests.map((guest) => (
											<span
												className={cn(
													'rounded-full px-2.5 py-1 text-sm',
													RESPONSE_STYLE[guest.response],
													guest.isMainGuest && 'font-bold'
												)}
												key={guest.id}
												title={`${guestFullName(guest)} — ${RESPONSE_TITLE[guest.response]}`}
											>
												{guestFullName(guest)}
											</span>
										))}
									</div>

									{/* the whole cluster sits at the trailing edge, under the names rather than beside
									    them, with the disclosure last so it stays the outermost thing in the row */}
									<div className='flex flex-wrap items-center justify-end gap-1 @lg:shrink-0'>
										<InvitationViews
											count={invitation.viewCount}
											lastViewedAt={invitation.lastViewedAt}
										/>

										{/* the host works down the list ticking off what they sent, so this is a
										    tick box. the label never changes, so the row cannot reflow under the
										    cursor between two clicks. */}
										<label
											className='flex h-9 cursor-pointer items-center gap-2 rounded-full px-2.5 text-[0.8rem] font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink @lg:h-7'
											title={
												invitation.sentAt
													? `Versendet am ${formatBerlinShort(invitation.sentAt)}`
													: 'Noch nicht versendet'
											}
										>
											<Checkbox
												checked={!!invitation.sentAt}
												data-testid={`sent-${invitation.id}`}
												onCheckedChange={(checked) =>
													toggleSent(invitation.id, Boolean(checked))
												}
											/>
											Versendet
										</label>

										<Button
											aria-label='Einladungslink kopieren'
											data-testid={`copy-${invitation.id}`}
											onClick={() => void copyLink(invitation.token)}
											className='h-9 @lg:h-7'
											size='sm'
											variant='outline'
										>
											<Copy /> Link
										</Button>

										<Button
											aria-expanded={expanded === invitation.id}
											aria-label='Weitere Einstellungen'
											data-testid={`expand-${invitation.id}`}
											onClick={() =>
												setExpanded(expanded === invitation.id ? null : invitation.id)
											}
											className='size-9 @lg:size-7'
											size='icon-sm'
											variant='ghost'
										>
											<ChevronDown
												className={cn(
													'transition-transform',
													expanded === invitation.id && 'rotate-180'
												)}
											/>
										</Button>
									</div>
								</div>

								{expanded === invitation.id ? (
									<InvitationDetails
										eventId={eventId}
										invitation={invitation}
										onRemoveGuest={deleteGuest}
										onRemoveInvitation={deleteInvitation}
									/>
								) : null}
							</li>
						))}
					</ul>
				)}
			</div>

			<p
				className='flex flex-wrap items-center gap-1 px-1 text-xs text-ink-soft'
				data-testid='guest-table-summary'
			>
				<span>
					{isFilterActive(filter)
						? `${visible.length} von ${optimistic.length} Einladungen`
						: `${optimistic.length} Einladung${optimistic.length === 1 ? '' : 'en'}`}
				</span>
				{filter.sent === 'all' && unsentCount > 0 ? (
					<Button
						className='h-auto p-0 text-xs'
						data-testid='show-unsent'
						onClick={() => setFilter({ ...filter, sent: 'unsent' })}
						variant='link'
					>
						<Send aria-hidden='true' /> {unsentCount} noch nicht versendet
					</Button>
				) : null}
			</p>
		</div>
	);
}
