import type { AccessFailure } from '@/lib/events/event-access';

// what every server action hands back. results cross this seam as data, never as thrown exceptions.

export type ActionResult<T = undefined> = { data: T; success: true } | { message: string; success: false };

export const ACTION_MESSAGES = {
	deadlinePassed: 'Die Frist ist abgelaufen — Änderungen sind nicht mehr möglich.',
	eventArchived: 'Dieses Event ist archiviert und kann nicht mehr geändert werden.',
	forbidden: 'Dafür fehlt dir die Berechtigung. Nur Inhaber und Admins dürfen das.',
	invalid: 'Die Eingabe ist nicht gültig.',
	notFound: 'Dieses Event gibt es nicht (mehr).',
	titleMismatch: 'Der eingegebene Name stimmt nicht mit dem Event überein.',
	tooManyRequests: 'Zu viele Versuche. Bitte warte einen Moment.',
} as const;

export function accessFailure(error: AccessFailure): { message: string; success: false } {
	return {
		message: error === 'forbidden' ? ACTION_MESSAGES.forbidden : ACTION_MESSAGES.notFound,
		success: false,
	};
}

export function failure(message: string): { message: string; success: false } {
	return { message, success: false };
}

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
	return { data, success: true };
}
