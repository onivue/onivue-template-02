import { isAfter } from 'date-fns';

// whether an invitation still accepts changes. the guest page reads this to decide what to render,
// and every write re-asks it — hiding a button is not a rule.

export type EventStatus = 'active' | 'archived';

export type ResponseWindowInput = {
	eventDeadline: Date | null;
	eventStatus: EventStatus;
	// a single invitation may be granted a later deadline, which is how a straggler is let back in
	invitationDeadline: Date | null;
};

export type ResponseWindow =
	| { closesAt: Date | null; open: true }
	| { open: false; reason: 'archived' | 'deadline-passed' };

// the invitation's own deadline wins outright; it is an exception, not an extension
export function effectiveDeadline(input: ResponseWindowInput): Date | null {
	return input.invitationDeadline ?? input.eventDeadline;
}

export function resolveResponseWindow(input: ResponseWindowInput, now: Date): ResponseWindow {
	if (input.eventStatus === 'archived') {
		return { open: false, reason: 'archived' };
	}

	const deadline = effectiveDeadline(input);

	if (!deadline) {
		return { closesAt: null, open: true };
	}

	// the deadline is the last moment that counts, so equality is still open
	if (isAfter(now, deadline)) {
		return { open: false, reason: 'deadline-passed' };
	}

	return { closesAt: deadline, open: true };
}
