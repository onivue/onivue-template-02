import { z } from 'zod';

// the invitation form is data, so its validation has to be built from that data. one schema per
// submission, derived from the event's fields and the responses the guest just picked — the same
// function runs in the browser and again on the server.

const TEXT_MAX_LENGTH = 200;
const TEXTAREA_MAX_LENGTH = 2000;

const MESSAGES = {
	notAnOption: 'Diese Auswahl gibt es nicht.',
	required: 'Diese Angabe fehlt.',
	tooLong: 'Diese Angabe ist zu lang.',
	unknownGuest: 'Diese Person gehört nicht zu dieser Einladung.',
} as const;

export type FormFieldType = 'checkbox' | 'radio' | 'select' | 'text' | 'textarea';
export type FormFieldScope = 'guest' | 'invitation';
export type GuestResponse = 'accepted' | 'declined' | 'open';

export type FormFieldOption = {
	id: string;
	label: string;
};

export type FormFieldDefinition = {
	helpText: null | string;
	id: string;
	label: string;
	onlyWhenAttending: boolean;
	options: FormFieldOption[];
	required: boolean;
	retiredAt: Date | null;
	scope: FormFieldScope;
	type: FormFieldType;
};

export type AnswerValue = string | string[];

export type SubmissionInput = {
	answers: Record<string, AnswerValue>;
	guests: Record<string, { answers: Record<string, AnswerValue>; response: GuestResponse }>;
};

export type Submission = SubmissionInput;

const answerValueSchema = z.union([z.string(), z.array(z.string())]);

const submissionShape = z.object({
	answers: z.record(z.string(), answerValueSchema),
	guests: z.record(
		z.string(),
		z.object({
			answers: z.record(z.string(), answerValueSchema),
			response: z.enum(['accepted', 'declined', 'open']),
		})
	),
});

const MULTI_VALUE_TYPES = new Set<FormFieldType>(['checkbox']);

function isMultiValue(field: FormFieldDefinition): boolean {
	return MULTI_VALUE_TYPES.has(field.type);
}

function maxLengthFor(field: FormFieldDefinition): number {
	return field.type === 'textarea' ? TEXTAREA_MAX_LENGTH : TEXT_MAX_LENGTH;
}

// a retired field is gone from the form but its answers stay readable, so it is never asked again.
// `onlyWhenAttending` is meaningless for an invitation-scoped field: an invitation has no response.
export function isFieldVisible(field: FormFieldDefinition, response: GuestResponse): boolean {
	if (field.retiredAt) {
		return false;
	}

	if (field.scope === 'invitation') {
		return true;
	}

	return !field.onlyWhenAttending || response === 'accepted';
}

function isEmpty(value: AnswerValue): boolean {
	return Array.isArray(value) ? value.length === 0 : value.trim().length === 0;
}

function normalize(field: FormFieldDefinition, value: AnswerValue): AnswerValue {
	if (isMultiValue(field)) {
		return Array.isArray(value) ? [...new Set(value)] : [value];
	}

	return Array.isArray(value) ? (value[0] ?? '') : value.trim();
}

type IssueSink = (path: (number | string)[], message: string) => void;

// one field, one value, one verdict. `enforceRequired` is passed in rather than read off the field,
// because a required field is only ever required of someone who is actually attending.
function checkAnswer(
	field: FormFieldDefinition,
	value: AnswerValue,
	enforceRequired: boolean,
	path: (number | string)[],
	addIssue: IssueSink
): void {
	// normalize already settles the shape: a checkbox always holds a list, everything else a string.
	// a single checked box arriving as a bare string is a browser habit, not an error.
	const normalized = normalize(field, value);

	if (isEmpty(normalized)) {
		if (enforceRequired && field.required) {
			addIssue(path, MESSAGES.required);
		}

		return;
	}

	if (field.options.length > 0) {
		const allowed = new Set(field.options.map((option) => option.id));
		const chosen = Array.isArray(normalized) ? normalized : [normalized];

		if (chosen.some((option) => !allowed.has(option))) {
			addIssue(path, MESSAGES.notAnOption);
		}

		return;
	}

	if (!Array.isArray(normalized) && normalized.length > maxLengthFor(field)) {
		addIssue(path, MESSAGES.tooLong);
	}
}

function collectVisible(
	fields: FormFieldDefinition[],
	scope: FormFieldScope,
	response: GuestResponse
): FormFieldDefinition[] {
	return fields.filter((field) => field.scope === scope && isFieldVisible(field, response));
}

function pickAnswers(fields: FormFieldDefinition[], answers: Record<string, AnswerValue>): Record<string, AnswerValue> {
	const picked: Record<string, AnswerValue> = {};

	for (const field of fields) {
		const value = answers[field.id];

		picked[field.id] = value === undefined ? (isMultiValue(field) ? [] : '') : normalize(field, value);
	}

	return picked;
}

// invitation-scoped fields are only demanded when somebody is actually coming — the same rule that
// lets a household decline in one click
function someoneIsAttending(submission: SubmissionInput): boolean {
	return Object.values(submission.guests).some((guest) => guest.response === 'accepted');
}

export function buildSubmissionSchema(fields: FormFieldDefinition[], guestIds: string[]) {
	const known = new Set(guestIds);

	return submissionShape
		.superRefine((submission, ctx) => {
			const addIssue: IssueSink = (path, message) => {
				ctx.addIssue({ code: 'custom', message, path });
			};

			for (const [guestId, guest] of Object.entries(submission.guests)) {
				if (!known.has(guestId)) {
					addIssue(['guests', guestId], MESSAGES.unknownGuest);

					continue;
				}

				for (const field of collectVisible(fields, 'guest', guest.response)) {
					const value = guest.answers[field.id] ?? (isMultiValue(field) ? [] : '');

					checkAnswer(
						field,
						value,
						guest.response === 'accepted',
						['guests', guestId, 'answers', field.id],
						addIssue
					);
				}
			}

			const enforceRequired = someoneIsAttending(submission);

			for (const field of collectVisible(fields, 'invitation', 'open')) {
				const value = submission.answers[field.id] ?? (isMultiValue(field) ? [] : '');

				checkAnswer(field, value, enforceRequired, ['answers', field.id], addIssue);
			}
		})
		.transform((submission): Submission => {
			const guests: Submission['guests'] = {};

			for (const [guestId, guest] of Object.entries(submission.guests)) {
				guests[guestId] = {
					answers: pickAnswers(collectVisible(fields, 'guest', guest.response), guest.answers),
					response: guest.response,
				};
			}

			return {
				answers: pickAnswers(collectVisible(fields, 'invitation', 'open'), submission.answers),
				guests,
			};
		});
}
