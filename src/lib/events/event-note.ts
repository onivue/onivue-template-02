import { z } from 'zod';

import { parseRichText, richTextValueSchema, serializeRichText } from '@/lib/events/rich-text';

// the free sections a host adds under the greeting: what there is to eat and drink, where to park,
// what to wear. they are a list rather than named columns, so a new kind of note is something a
// host writes, not a migration.

export const MAX_EVENT_NOTES = 3;

// a curated set, kept as a key in the database so adding the next one is a change here rather than
// a migration. the label doubles as the title a host gets when they pick the symbol.
export const EVENT_NOTE_ICONS = {
	drinks: { label: 'Getränke' },
	dresscode: { label: 'Dresscode' },
	food: { label: 'Essen & Trinken' },
	gift: { label: 'Geschenke' },
	info: { label: 'Gut zu wissen' },
	music: { label: 'Musik' },
	parking: { label: 'Parken' },
	travel: { label: 'Anreise' },
} as const;

export type EventNoteIcon = keyof typeof EVENT_NOTE_ICONS;

export const EVENT_NOTE_ICON_KEYS = Object.keys(EVENT_NOTE_ICONS) as EventNoteIcon[];

export const DEFAULT_EVENT_NOTE_ICON: EventNoteIcon = 'info';

export const EVENT_NOTE_MESSAGES = {
	incomplete: 'Jeder Abschnitt braucht einen Titel und einen Text.',
	tooMany: `Mehr als ${MAX_EVENT_NOTES} Abschnitte gehen nicht.`,
} as const;

export function isEventNoteIcon(value: unknown): value is EventNoteIcon {
	return typeof value === 'string' && value in EVENT_NOTE_ICONS;
}

export const eventNoteSchema = z.object({
	// the serialized rich text document, the same shape the greeting column holds
	body: richTextValueSchema,
	icon: z.enum(EVENT_NOTE_ICON_KEYS),
	// the editor keeps one per note, so removing the middle of three cannot hand the last one
	// somebody else's text
	id: z.string().min(1).max(64),
	title: z.string().trim().min(1).max(60),
});

export const eventNotesSchema = z.array(eventNoteSchema).max(MAX_EVENT_NOTES);

export type EventNote = z.infer<typeof eventNoteSchema>;

export type EventNotesResult = { message: string; success: false } | { notes: EventNote[]; success: true };

type EventNoteDraft = { body?: unknown; icon?: unknown; id?: unknown; title?: unknown };

// a section the host added and then left alone is not an error, it is a section they did not want;
// one they half filled in is, because neither half reads as anything on its own
export function prepareEventNotes(drafts: unknown): EventNotesResult {
	if (!Array.isArray(drafts)) {
		return { notes: [], success: true };
	}

	if (drafts.length > MAX_EVENT_NOTES) {
		return { message: EVENT_NOTE_MESSAGES.tooMany, success: false };
	}

	const notes: EventNote[] = [];

	for (const draft of drafts as EventNoteDraft[]) {
		const title = typeof draft.title === 'string' ? draft.title.trim() : '';
		// parsed and written back rather than passed through: this is where an editor's json is
		// stripped down to what the schema knows
		const body = serializeRichText(parseRichText(typeof draft.body === 'string' ? draft.body : null));

		if (!title && !body) {
			continue;
		}

		if (!title || !body) {
			return { message: EVENT_NOTE_MESSAGES.incomplete, success: false };
		}

		const parsed = eventNoteSchema.safeParse({
			body,
			icon: isEventNoteIcon(draft.icon) ? draft.icon : DEFAULT_EVENT_NOTE_ICON,
			id: typeof draft.id === 'string' && draft.id ? draft.id : crypto.randomUUID(),
			title,
		});

		if (!parsed.success) {
			return { message: parsed.error.issues[0]?.message ?? EVENT_NOTE_MESSAGES.incomplete, success: false };
		}

		notes.push(parsed.data);
	}

	return { notes, success: true };
}

// what a column holds is data somebody wrote, not data this version of the app agrees with
export function readEventNotes(value: unknown): EventNote[] {
	const parsed = eventNotesSchema.safeParse(value);

	return parsed.success ? parsed.data : [];
}
