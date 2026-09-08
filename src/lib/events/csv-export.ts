import type { AnswerValue } from '@/lib/events/form-schema';

// catering and seating happen in a spreadsheet, so the export is the point where this app hands
// over. one row per person, every field as its own column, retired fields included.

const SEPARATOR = ';';
const NEWLINE = '\r\n';
// excel reads a semicolon-separated file as german only when it is announced as utf-8
const BOM = '﻿';

const RESPONSE_LABELS = {
	accepted: 'zugesagt',
	declined: 'abgesagt',
	open: 'offen',
} as const;

const AGE_LABELS = {
	adult: 'Erwachsen',
	child: 'Kind',
} as const;

export type ExportField = {
	id: string;
	label: string;
	options: { id: string; label: string }[];
	retiredAt: Date | null;
	scope: 'guest' | 'invitation';
};

export type ExportGuest = {
	ageGroup: 'adult' | 'child';
	email: null | string;
	firstName: string;
	id: string;
	isMainGuest: boolean;
	lastName: null | string;
	note: null | string;
	respondedAt: Date | null;
	response: 'accepted' | 'declined' | 'open';
};

export type ExportInvitation = {
	guests: ExportGuest[];
	id: string;
	responseDeadline: Date | null;
	sentAt: Date | null;
};

export type ExportAnswer = {
	fieldId: string;
	guestId: null | string;
	invitationId: null | string;
	value: AnswerValue;
};

export type CsvExportInput = {
	answers: ExportAnswer[];
	fields: ExportField[];
	formatDate: (date: Date | null) => string;
	// a deadline may name a day without a time, and reads differently from a moment that was stamped
	formatDeadline: (date: Date | null) => string;
	invitations: ExportInvitation[];
};

function escapeCell(value: string): string {
	if (!/["\n\r;]/.test(value)) {
		return value;
	}

	return `"${value.replaceAll('"', '""')}"`;
}

// answers are stored as option ids so a relabelled option keeps its answers; the export shows the
// labels a person would recognise
function toLabel(field: ExportField, value: AnswerValue | undefined): string {
	if (value === undefined) {
		return '';
	}

	const chosen = Array.isArray(value) ? value : [value];

	if (field.options.length === 0) {
		return chosen.join(', ');
	}

	return chosen.map((entry) => field.options.find((option) => option.id === entry)?.label ?? entry).join(', ');
}

function columnTitle(field: ExportField): string {
	const scope = field.scope === 'invitation' ? ' (Einladung)' : '';
	const retired = field.retiredAt ? ' [zurückgezogen]' : '';

	return `${field.label}${scope}${retired}`;
}

export function toCsv(input: CsvExportInput): string {
	const header = [
		'Einladung',
		'Hauptperson',
		'Vorname',
		'Nachname',
		'E-Mail',
		'Kategorie',
		'Status',
		'Antwort am',
		'Versendet am',
		'Eigene Frist',
		'Interne Notiz',
		...input.fields.map(columnTitle),
	];

	const rows = input.invitations.flatMap((invitation, invitationIndex) =>
		invitation.guests.map((guest) => [
			String(invitationIndex + 1),
			guest.isMainGuest ? 'ja' : 'nein',
			guest.firstName,
			guest.lastName ?? '',
			guest.email ?? '',
			AGE_LABELS[guest.ageGroup],
			RESPONSE_LABELS[guest.response],
			input.formatDate(guest.respondedAt),
			input.formatDate(invitation.sentAt),
			input.formatDeadline(invitation.responseDeadline),
			guest.note ?? '',
			...input.fields.map((field) =>
				toLabel(
					field,
					input.answers.find((answer) =>
						field.scope === 'guest'
							? answer.fieldId === field.id && answer.guestId === guest.id
							: answer.fieldId === field.id && answer.invitationId === invitation.id
					)?.value
				)
			),
		])
	);

	return BOM + [header, ...rows].map((row) => row.map(escapeCell).join(SEPARATOR)).join(NEWLINE) + NEWLINE;
}

export function toCsvFilename(title: string): string {
	const slug =
		title
			.toLowerCase()
			.replaceAll('ä', 'ae')
			.replaceAll('ö', 'oe')
			.replaceAll('ü', 'ue')
			.replaceAll('ß', 'ss')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'event';

	return `${slug}-gaesteliste.csv`;
}
