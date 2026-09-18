import type { EventNote } from '@/lib/events/event-note';

import { EventIconTile } from '@/components/events/event-icon-tile';
import { EventNoteIcon } from '@/components/events/event-note-icon';
import { Divided } from '@/components/layout/divided';
import { RichText } from '@/components/ui/rich-text';
import { parseRichText } from '@/lib/events/rich-text';

// the host's own sections. one panel for all of them, not one per section: a single note left on
// its own under the centred date and address made the column look lopsided, and three loose blocks
// would only repeat that three times. inside, each note is a row like the two facts above — icon
// tile, title, words.
export function InvitationNotes({ notes }: { notes: EventNote[] }) {
	if (notes.length === 0) {
		return null;
	}

	return (
		<Divided className='design-panel p-5 sm:p-6' data-testid='invitation-notes'>
			{notes.map((note) => (
				<div
					className='flex items-start gap-4 text-left'
					data-testid={`invitation-note-${note.icon}`}
					key={note.id}
				>
					<EventIconTile>
						<EventNoteIcon icon={note.icon} />
					</EventIconTile>
					<div className='min-w-0 flex-1'>
						<p className='text-base leading-tight font-bold text-ink'>{note.title}</p>
						<RichText className='mt-1.5 text-sm text-ink-soft' value={parseRichText(note.body)} />
					</div>
				</div>
			))}
		</Divided>
	);
}
