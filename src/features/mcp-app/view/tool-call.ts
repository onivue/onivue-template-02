import type { App } from '@modelcontextprotocol/ext-apps/react';
import type { z } from 'zod';

// every read the view does goes through the host as a tools/call — there is no second, direct path
// to the data. the host decides whether the call is allowed, so this is also where a refusal lands.

export type TToolOutcome<T> = { data: T; success: true } | { message: string; success: false };

type TToolResultLike = {
	content?: unknown;
	isError?: boolean;
	structuredContent?: unknown;
};

const MESSAGES = {
	disconnected: 'Keine Verbindung zum Host.',
	failed: 'Der Aufruf ist fehlgeschlagen.',
	unreadable: 'Die Antwort des Servers war unlesbar.',
} as const;

// a failing tool answers in the content blocks, not in structuredContent, so that is where the
// reason a person can act on lives
function readErrorText(result: TToolResultLike): string {
	if (!Array.isArray(result.content)) {
		return MESSAGES.failed;
	}

	const text = result.content
		.filter((block): block is { text: string; type: 'text' } => {
			return !!block && typeof block === 'object' && 'text' in block && typeof block.text === 'string';
		})
		.map((block) => block.text)
		.join(' ')
		.trim();

	return text || MESSAGES.failed;
}

export function readToolResult<T>(result: TToolResultLike, schema: z.ZodType<T>): TToolOutcome<T> {
	if (result.isError) {
		return { message: readErrorText(result), success: false };
	}

	const parsed = schema.safeParse(result.structuredContent);

	if (!parsed.success) {
		return { message: MESSAGES.unreadable, success: false };
	}

	return { data: parsed.data, success: true };
}

export async function callTool<T>(
	app: App | null,
	name: string,
	args: Record<string, unknown>,
	schema: z.ZodType<T>
): Promise<TToolOutcome<T>> {
	if (!app) {
		return { message: MESSAGES.disconnected, success: false };
	}

	try {
		return readToolResult(await app.callServerTool({ arguments: args, name }), schema);
	} catch (error) {
		return { message: error instanceof Error ? error.message : MESSAGES.failed, success: false };
	}
}
