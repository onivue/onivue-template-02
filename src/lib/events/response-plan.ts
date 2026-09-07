import type { AnswerValue, GuestResponse, Submission } from '@/lib/events/form-schema';

// turning "what the guest just sent" into "what has to change". pure on purpose: the history is
// only worth keeping if it records real changes, and that comparison is where the mistakes live.

export type LogActor = 'admin' | 'guest';

export type CurrentGuest = {
	id: string;
	respondedAt: Date | null;
	response: GuestResponse;
};

export type CurrentAnswer = {
	fieldId: string;
	// null means the answer belongs to the invitation as a whole
	guestId: null | string;
	value: AnswerValue;
};

export type InvitationState = {
	answers: CurrentAnswer[];
	guests: CurrentGuest[];
};

export type GuestUpdate = {
	guestId: string;
	respondedAt: Date | null;
	response: GuestResponse;
};

export type AnswerWrite = {
	fieldId: string;
	guestId: null | string;
	value: AnswerValue;
};

export type AnswerRemoval = {
	fieldId: string;
	guestId: null | string;
};

export type LogEntry = {
	actor: LogActor;
	fieldId: null | string;
	guestId: null | string;
	kind: 'answer' | 'response';
	nextValue: AnswerValue | null;
	previousValue: AnswerValue | null;
};

export type ResponsePlan = {
	answerRemovals: AnswerRemoval[];
	answerWrites: AnswerWrite[];
	guestUpdates: GuestUpdate[];
	logEntries: LogEntry[];
};

function isEmpty(value: AnswerValue): boolean {
	return Array.isArray(value) ? value.length === 0 : value.trim().length === 0;
}

// checkbox order carries no meaning, so a reordered list is not a change worth recording
function isSameValue(left: AnswerValue | undefined, right: AnswerValue): boolean {
	if (left === undefined) {
		return false;
	}

	if (Array.isArray(left) && Array.isArray(right)) {
		return left.length === right.length && left.toSorted().join(' ') === right.toSorted().join(' ');
	}

	return left === right;
}

function answerKey(guestId: null | string, fieldId: string): string {
	return `${guestId ?? ''}:${fieldId}`;
}

function toAnswerMap(answers: CurrentAnswer[]): Map<string, AnswerValue> {
	return new Map(answers.map((answer) => [answerKey(answer.guestId, answer.fieldId), answer.value]));
}

// the first response is timestamped once and then left alone; later changes live in the log
function nextRespondedAt(current: CurrentGuest, response: GuestResponse, now: Date): Date | null {
	if (response === 'open') {
		return current.respondedAt;
	}

	return current.respondedAt ?? now;
}

export function planResponseUpdate(
	state: InvitationState,
	submission: Submission,
	context: { actor: LogActor; now: Date }
): ResponsePlan {
	const plan: ResponsePlan = { answerRemovals: [], answerWrites: [], guestUpdates: [], logEntries: [] };
	const currentAnswers = toAnswerMap(state.answers);

	const applyAnswers = (guestId: null | string, answers: Record<string, AnswerValue>): void => {
		for (const [fieldId, value] of Object.entries(answers)) {
			const previous = currentAnswers.get(answerKey(guestId, fieldId));

			if (isSameValue(previous, value)) {
				continue;
			}

			if (isEmpty(value)) {
				// nothing was stored and nothing was sent: an untouched field, not a change
				if (previous === undefined) {
					continue;
				}

				plan.answerRemovals.push({ fieldId, guestId });
				plan.logEntries.push({
					actor: context.actor,
					fieldId,
					guestId,
					kind: 'answer',
					nextValue: null,
					previousValue: previous,
				});

				continue;
			}

			plan.answerWrites.push({ fieldId, guestId, value });
			plan.logEntries.push({
				actor: context.actor,
				fieldId,
				guestId,
				kind: 'answer',
				nextValue: value,
				previousValue: previous ?? null,
			});
		}
	};

	for (const guest of state.guests) {
		const submitted = submission.guests[guest.id];

		// a guest the submission does not mention is left exactly as they were
		if (!submitted) {
			continue;
		}

		if (submitted.response !== guest.response) {
			plan.guestUpdates.push({
				guestId: guest.id,
				respondedAt: nextRespondedAt(guest, submitted.response, context.now),
				response: submitted.response,
			});
			plan.logEntries.push({
				actor: context.actor,
				fieldId: null,
				guestId: guest.id,
				kind: 'response',
				nextValue: submitted.response,
				previousValue: guest.response,
			});
		}

		applyAnswers(guest.id, submitted.answers);
	}

	applyAnswers(null, submission.answers);

	return plan;
}

export function isEmptyPlan(plan: ResponsePlan): boolean {
	return (
		plan.answerRemovals.length === 0 &&
		plan.answerWrites.length === 0 &&
		plan.guestUpdates.length === 0 &&
		plan.logEntries.length === 0
	);
}
