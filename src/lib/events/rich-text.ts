import { z } from 'zod';

// the host's longer texts — the greeting, what there is to eat and drink, and everything else worth
// knowing. they are kept as a validated document rather than as a string of html: nothing on the
// guest page is ever handed to dangerouslySetInnerHTML, and whatever an editor produces is parsed
// through this schema again on the server before it reaches a column.
//
// the columns stay `text` and hold the serialized document. anything written before rich text
// existed is still plain text, which parseRichText reads as paragraphs — there is nothing to
// migrate, and a legacy greeting keeps its line breaks.

const BULLET = '• ';
const NESTED_INDENT = '  ';

export const RICH_TEXT_MAX_LENGTH = 20000;

const markSchema = z.object({ type: z.enum(['bold', 'italic']) });

const textSchema = z.object({
	marks: z.array(markSchema).optional(),
	text: z.string(),
	type: z.literal('text'),
});

const hardBreakSchema = z.object({ type: z.literal('hardBreak') });

const inlineSchema = z.union([textSchema, hardBreakSchema]);

const paragraphSchema = z.object({
	content: z.array(inlineSchema).optional(),
	type: z.literal('paragraph'),
});

type Paragraph = z.infer<typeof paragraphSchema>;
type ListItem = { content: (BulletList | Paragraph)[]; type: 'listItem' };
type BulletList = { content: ListItem[]; type: 'bulletList' };

// a list may hold a list: a guest pasting from a website brings one along, and dropping it
// silently would cost them the paste
const listItemSchema: z.ZodType<ListItem> = z.lazy(() =>
	z.object({
		content: z.array(z.union([paragraphSchema, bulletListSchema])),
		type: z.literal('listItem'),
	})
);

const bulletListSchema: z.ZodType<BulletList> = z.lazy(() =>
	z.object({
		content: z.array(listItemSchema),
		type: z.literal('bulletList'),
	})
);

const blockSchema = z.union([paragraphSchema, bulletListSchema]);

export const richTextDocumentSchema = z.object({
	content: z.array(blockSchema).optional(),
	type: z.literal('doc'),
});

// the serialized document as it travels from the editor to a server action
export const richTextValueSchema = z.string().max(RICH_TEXT_MAX_LENGTH, 'Der Text ist zu lang.');

export type RichTextBlock = z.infer<typeof blockSchema>;
export type RichTextDocument = z.infer<typeof richTextDocumentSchema>;
export type RichTextInline = z.infer<typeof inlineSchema>;
export type RichTextListItem = ListItem;

export const EMPTY_RICH_TEXT: RichTextDocument = { content: [], type: 'doc' };

// an editor hands back its own json; anything this schema does not know is dropped rather than
// stored, which is where the sanitising happens
export function toRichTextDocument(value: unknown): RichTextDocument {
	const parsed = richTextDocumentSchema.safeParse(value);

	return parsed.success ? parsed.data : EMPTY_RICH_TEXT;
}

export function richTextFromPlainText(value: string): RichTextDocument {
	return {
		content: value
			.split('\n')
			.map((line) =>
				line ? { content: [{ text: line, type: 'text' }], type: 'paragraph' } : { type: 'paragraph' }
			),
		type: 'doc',
	};
}

// a column holds either a serialized document or, from before rich text existed, plain text
export function parseRichText(value: null | string | undefined): RichTextDocument {
	if (!value?.trim()) {
		return EMPTY_RICH_TEXT;
	}

	if (!value.trimStart().startsWith('{')) {
		return richTextFromPlainText(value);
	}

	try {
		return toRichTextDocument(JSON.parse(value));
	} catch {
		return richTextFromPlainText(value);
	}
}

// null rather than an empty document, so "nothing written here" reads the same in every column
export function serializeRichText(document: RichTextDocument): null | string {
	return isRichTextEmpty(document) ? null : JSON.stringify(document);
}

function inlineToText(nodes: RichTextInline[]): string {
	return nodes.map((node) => (node.type === 'text' ? node.text : '\n')).join('');
}

function listToLines(list: BulletList, indent: string): string[] {
	return list.content.flatMap((item) =>
		item.content.flatMap((child) =>
			child.type === 'paragraph'
				? [`${indent}${BULLET}${inlineToText(child.content ?? [])}`]
				: listToLines(child, `${indent}${NESTED_INDENT}`)
		)
	);
}

// what the ics description, the link preview and an agent reading the event get: the same words
// without their marks
export function richTextToPlainText(document: RichTextDocument): string {
	const lines = (document.content ?? []).flatMap((block) =>
		block.type === 'paragraph' ? [inlineToText(block.content ?? [])] : listToLines(block, '')
	);

	return lines.join('\n').trim();
}

export function isRichTextEmpty(document: RichTextDocument): boolean {
	return richTextToPlainText(document) === '';
}
