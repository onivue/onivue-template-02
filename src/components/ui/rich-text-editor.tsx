'use client';

import type { Editor } from '@tiptap/react';

import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Bold, Italic, List } from 'lucide-react';

import type { RichTextDocument } from '@/lib/events/rich-text';

import { Button } from '@/components/ui/button';
import { toRichTextDocument } from '@/lib/events/rich-text';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
	className?: string;
	'data-testid'?: string;
	// the editor owns its content once it is mounted, the way a contenteditable has to: this is the
	// document it starts from, not a value it is held at
	defaultValue: RichTextDocument;
	label: string;
	onChange: (value: RichTextDocument) => void;
	placeholder?: string;
};

type ToolbarButtonProps = {
	icon: typeof Bold;
	isActive: boolean;
	label: string;
	onPress: () => void;
	testId: string;
};

// the whole vocabulary: bold, italic, bullets. everything else stays out of the schema, so a paste
// from somewhere else cannot smuggle a heading or a link into an invitation.
const EXTENSIONS = [
	StarterKit.configure({
		blockquote: false,
		code: false,
		codeBlock: false,
		heading: false,
		horizontalRule: false,
		link: false,
		orderedList: false,
		strike: false,
		trailingNode: false,
		underline: false,
	}),
];

function ToolbarButton({ icon: Icon, isActive, label, onPress, testId }: ToolbarButtonProps) {
	return (
		<Button
			aria-label={label}
			aria-pressed={isActive}
			className='aria-pressed:bg-muted aria-pressed:text-foreground'
			data-testid={testId}
			// the selection is what the button acts on, so it must survive the click
			onMouseDown={(nativeEvent) => nativeEvent.preventDefault()}
			onClick={onPress}
			size='icon-sm'
			type='button'
			variant='ghost'
		>
			<Icon aria-hidden='true' />
		</Button>
	);
}

function Toolbar({ editor }: { editor: Editor }) {
	const marks = useEditorState({
		editor,
		selector: ({ editor: instance }) => ({
			bold: instance.isActive('bold'),
			bulletList: instance.isActive('bulletList'),
			italic: instance.isActive('italic'),
		}),
	});

	return (
		<div className='flex items-center gap-1 border-b border-input px-2 py-1.5' data-testid='rich-text-toolbar'>
			<ToolbarButton
				icon={Bold}
				isActive={marks.bold}
				label='Fett'
				onPress={() => editor.chain().focus().toggleBold().run()}
				testId='rich-text-bold'
			/>
			<ToolbarButton
				icon={Italic}
				isActive={marks.italic}
				label='Kursiv'
				onPress={() => editor.chain().focus().toggleItalic().run()}
				testId='rich-text-italic'
			/>
			<ToolbarButton
				icon={List}
				isActive={marks.bulletList}
				label='Aufzählung'
				onPress={() => editor.chain().focus().toggleBulletList().run()}
				testId='rich-text-bullet-list'
			/>
		</div>
	);
}

// the writing half of the rich text control. it hands back a document, never html, and that
// document is validated again in the action that stores it.
export function RichTextEditor({
	className,
	defaultValue,
	label,
	onChange,
	placeholder,
	...props
}: RichTextEditorProps) {
	const editor = useEditor({
		content: defaultValue,
		editorProps: {
			attributes: {
				'aria-label': label,
				class: 'design-richtext-body min-h-24 px-4 py-3 outline-none',
			},
		},
		extensions: placeholder ? [...EXTENSIONS, Placeholder.configure({ placeholder })] : EXTENSIONS,
		// a contenteditable rendered on the server would not match what the browser makes of it
		immediatelyRender: false,
		onUpdate: ({ editor: instance }) => onChange(toRichTextDocument(instance.getJSON())),
	});

	return (
		<div className={cn('design-richtext', className)} data-testid={props['data-testid']}>
			{editor ? <Toolbar editor={editor} /> : null}
			<EditorContent editor={editor} />
		</div>
	);
}
