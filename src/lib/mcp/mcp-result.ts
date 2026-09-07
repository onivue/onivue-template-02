import type { CallToolResult } from '@modelcontextprotocol/server';

// the two shapes every tool answers in, shared by the profile and the event tools

export function toolSuccess<T extends Record<string, unknown>>(data: T): CallToolResult {
	return {
		content: [{ text: JSON.stringify(data), type: 'text' }],
		structuredContent: data,
	};
}

export function toolError(message: string): CallToolResult {
	return { content: [{ text: message, type: 'text' }], isError: true };
}
