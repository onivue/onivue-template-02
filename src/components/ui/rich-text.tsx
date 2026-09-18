import type { RichTextBlock, RichTextDocument, RichTextInline, RichTextListItem } from '@/lib/events/rich-text';

import { isRichTextEmpty } from '@/lib/events/rich-text';
import { cn } from '@/lib/utils';

type RichTextProps = {
	className?: string;
	value: RichTextDocument;
};

// the reading half of the rich text control. the document is validated data, never a string of
// html, so this renders elements rather than handing anything to dangerouslySetInnerHTML.

function InlineNode({ node }: { node: RichTextInline }) {
	if (node.type === 'hardBreak') {
		return <br />;
	}

	const marks = node.marks ?? [];
	const text = marks.some((mark) => mark.type === 'italic') ? <em>{node.text}</em> : node.text;

	return marks.some((mark) => mark.type === 'bold') ? <strong>{text}</strong> : text;
}

function InlineContent({ nodes }: { nodes: RichTextInline[] }) {
	return nodes.map((node, index) => <InlineNode key={index} node={node} />);
}

function ListItemNode({ item }: { item: RichTextListItem }) {
	return (
		<li>
			{item.content.map((child, index) => (
				<BlockNode block={child} key={index} />
			))}
		</li>
	);
}

function BlockNode({ block }: { block: RichTextBlock }) {
	if (block.type === 'paragraph') {
		return (
			<p>
				<InlineContent nodes={block.content ?? []} />
			</p>
		);
	}

	return (
		<ul>
			{block.content.map((item, index) => (
				<ListItemNode item={item} key={index} />
			))}
		</ul>
	);
}

export function RichText({ className, value }: RichTextProps) {
	if (isRichTextEmpty(value)) {
		return null;
	}

	return (
		<div className={cn('design-richtext-body', className)}>
			{(value.content ?? []).map((block, index) => (
				<BlockNode block={block} key={index} />
			))}
		</div>
	);
}
