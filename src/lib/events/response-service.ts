import type { Submission } from '@/lib/events/form-schema';
import type { InvitationState, LogActor, ResponsePlan } from '@/lib/events/response-plan';
import type { ResponseWindowInput } from '@/lib/events/response-window';

import { isEmptyPlan, planResponseUpdate } from '@/lib/events/response-plan';
import { resolveResponseWindow } from '@/lib/events/response-window';

// the one way a response reaches the database. it re-asks whether the invitation is still open
// rather than trusting that the page hid the buttons.

export type ResponseStore = {
	apply(invitationId: string, plan: ResponsePlan): Promise<void>;
};

export type SubmitParams = {
	actor: LogActor;
	invitationId: string;
	state: InvitationState;
	submission: Submission;
	window: ResponseWindowInput;
};

export type SubmitResult =
	| { changed: boolean; success: true }
	| { error: 'archived' | 'deadline-passed'; success: false };

export class ResponseService {
	public constructor(
		private readonly store: ResponseStore,
		private readonly clock: () => Date
	) {}

	public async submit(params: SubmitParams): Promise<SubmitResult> {
		const now = this.clock();

		// the deadline binds the guests it was set for. the host is not answering through a link and
		// may still correct their own event afterwards.
		if (params.actor === 'guest') {
			const window = resolveResponseWindow(params.window, now);

			if (!window.open) {
				return { error: window.reason, success: false };
			}
		}

		const plan = planResponseUpdate(params.state, params.submission, { actor: params.actor, now });

		if (isEmptyPlan(plan)) {
			return { changed: false, success: true };
		}

		await this.store.apply(params.invitationId, plan);

		return { changed: true, success: true };
	}
}
