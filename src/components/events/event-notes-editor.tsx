'use client';

import { Plus, Trash2 } from 'lucide-react';

import type { EventNoteIcon as EventNoteIconKey } from '@/lib/events/event-note';
import type { RichTextDocument } from '@/lib/events/rich-text';

import { EventNoteIcon } from '@/components/events/event-note-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	DEFAULT_EVENT_NOTE_ICON,
	EVENT_NOTE_ICON_KEYS,
	EVENT_NOTE_ICONS,
	isEventNoteIcon,
	MAX_EVENT_NOTES,
} from '@/lib/events/event-note';
import { EMPTY_RICH_TEXT } from '@/lib/events/rich-text';

export type EventNoteDraft = {
	body: RichTextDocument;
	icon: EventNoteIconKey;
	// the editor below it is uncontrolled, so a draft has to stay the same draft when the one above
	// it is removed
	id: string;
	title: string;
};

type EventNotesEditorProps = {
	notes: EventNoteDraft[];
	onChange: (notes: EventNoteDraft[]) => void;
};

export function newEventNoteDraft(): EventNoteDraft {
	return { body: EMPTY_RICH_TEXT, icon: DEFAULT_EVENT_NOTE_ICON, id: crypto.randomUUID(), title: '' };
}

// picking a symbol is the fastest way to say what a section is about, so it writes the title too —
// until the host has put their own words there
function titleFor(note: EventNoteDraft, icon: EventNoteIconKey): string {
	return !note.title.trim() || note.title === EVENT_NOTE_ICONS[note.icon].label
		? EVENT_NOTE_ICONS[icon].label
		: note.title;
}

function NoteEditor({
	note,
	onChange,
	onRemove,
	position,
}: {
	note: EventNoteDraft;
	onChange: (note: EventNoteDraft) => void;
	onRemove: () => void;
	position: number;
}) {
	return (
		<div className='grid gap-4 rounded-2xl border border-border p-4' data-testid={`note-${position}`}>
			<div className='flex items-center justify-between gap-2'>
				<span className='design-label'>Abschnitt {position + 1}</span>
				<Button
					data-testid={`note-${position}-remove`}
					onClick={onRemove}
					size='sm'
					type='button'
					variant='ghost'
				>
					<Trash2 data-icon='inline-start' /> Entfernen
				</Button>
			</div>

			<div className='design-field'>
				<span className='design-label'>Symbol</span>
				<Select
					onValueChange={(next) => {
						const icon = isEventNoteIcon(next) ? next : DEFAULT_EVENT_NOTE_ICON;

						onChange({ ...note, icon, title: titleFor(note, icon) });
					}}
					value={note.icon}
				>
					<SelectTrigger data-testid={`note-${position}-icon`} size='field'>
						<SelectValue>
							{(key) => (
								<span className='flex items-center gap-2'>
									<EventNoteIcon icon={isEventNoteIcon(key) ? key : note.icon} />
									{EVENT_NOTE_ICONS[isEventNoteIcon(key) ? key : note.icon].label}
								</span>
							)}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{EVENT_NOTE_ICON_KEYS.map((key) => (
							<SelectItem key={key} value={key}>
								<span className='flex items-center gap-2'>
									<EventNoteIcon icon={key} />
									{EVENT_NOTE_ICONS[key].label}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<label className='design-field'>
				<span className='design-label'>Titel</span>
				<Input
					data-testid={`note-${position}-title`}
					maxLength={60}
					onChange={(nativeEvent) => onChange({ ...note, title: nativeEvent.target.value })}
					placeholder='z. B. Essen & Trinken'
					value={note.title}
				/>
			</label>

			<div className='design-field'>
				<span className='design-label'>Text</span>
				<RichTextEditor
					data-testid={`note-${position}-body`}
					defaultValue={note.body}
					label={`Text zu Abschnitt ${position + 1}`}
					onChange={(body) => onChange({ ...note, body })}
					placeholder='Was deine Gäste dazu wissen sollten.'
				/>
			</div>
		</div>
	);
}

// the sections under the greeting. a host adds what their event actually needs instead of filling
// in fields the app guessed at, and the guest page shows them in this order.
export function EventNotesEditor({ notes, onChange }: EventNotesEditorProps) {
	return (
		<div className='grid gap-3' data-testid='event-notes'>
			<span className='design-label'>Weitere Abschnitte (optional)</span>

			{notes.map((note, index) => (
				<NoteEditor
					key={note.id}
					note={note}
					onChange={(next) => onChange(notes.map((current) => (current.id === note.id ? next : current)))}
					onRemove={() => onChange(notes.filter((current) => current.id !== note.id))}
					position={index}
				/>
			))}

			<Button
				className='w-fit'
				data-testid='note-add'
				disabled={notes.length >= MAX_EVENT_NOTES}
				onClick={() => onChange([...notes, newEventNoteDraft()])}
				size='xl'
				type='button'
				variant='outline'
			>
				<Plus data-icon='inline-start' /> Abschnitt hinzufügen
			</Button>

			<span className='text-xs text-ink-soft'>
				Bis zu {MAX_EVENT_NOTES} Abschnitte — zum Beispiel Essen & Trinken, Parken oder Dresscode. Sie stehen
				auf der Einladung unter der Begrüßung.
			</span>
		</div>
	);
}
