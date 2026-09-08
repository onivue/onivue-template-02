import type { AnswerValue, FormFieldDefinition, GuestResponse, Submission } from '@/lib/events/form-schema';

// what a host is told after someone answers: who, what they said, and what they wrote in the form.
// pure, so the wording can be checked without rendering an email or touching the database.

export type SummaryLine = {
	label: string;
	value: string;
};

export type SummaryGuest = {
	answers: SummaryLine[];
	name: string;
	response: GuestResponse;
};

export type ResponseSummary = {
	answers: SummaryLine[];
	counts: Record<GuestResponse, number>;
	guests: SummaryGuest[];
};

export type SummaryInput = {
	fields: FormFieldDefinition[];
	guests: { firstName: string; id: string; lastName: null | string }[];
	submission: Submission;
};

const VALUE_SEPARATOR = ', ';
const NO_ANSWER = '—';

export function guestName(guest: { firstName: string; lastName: null | string }): string {
	return guest.lastName ? `${guest.firstName} ${guest.lastName}` : guest.firstName;
}

// choice fields store option ids, so the email would otherwise read 'vegetarisch-2'
function toLabel(field: FormFieldDefinition, value: AnswerValue): string {
	const chosen = Array.isArray(value) ? value : [value];
	const labels = chosen
		.map((entry) => field.options.find((option) => option.id === entry)?.label ?? entry)
		.filter(Boolean);

	return labels.length > 0 ? labels.join(VALUE_SEPARATOR) : NO_ANSWER;
}

// the form's own order, and only the fields that were actually answered — a list of empty rows
// tells the host nothing
function toLines(fields: FormFieldDefinition[], answers: Record<string, AnswerValue>): SummaryLine[] {
	return fields
		.filter((field) => field.id in answers)
		.map((field) => ({ label: field.label, value: toLabel(field, answers[field.id] ?? '') }))
		.filter((line) => line.value !== NO_ANSWER);
}

export function summariseResponse({ fields, guests, submission }: SummaryInput): ResponseSummary {
	const guestFields = fields.filter((field) => field.scope === 'guest');
	const invitationFields = fields.filter((field) => field.scope === 'invitation');
	const counts: Record<GuestResponse, number> = { accepted: 0, declined: 0, open: 0 };

	const summarised = guests
		.filter((guest) => guest.id in submission.guests)
		.map((guest) => {
			const answered = submission.guests[guest.id];
			const response = answered?.response ?? 'open';

			counts[response] += 1;

			return {
				answers: toLines(guestFields, answered?.answers ?? {}),
				name: guestName(guest),
				response,
			};
		});

	return { answers: toLines(invitationFields, submission.answers), counts, guests: summarised };
}
