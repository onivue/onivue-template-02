import 'server-only';
import type { EmailGateway } from '@/lib/email/email-gateway';
import type { FormFieldDefinition, Submission } from '@/lib/events/form-schema';

import { APP_CONFIG } from '@/config/app';
import { SERVER_CONFIG } from '@/config/env';
import { eventPath } from '@/config/routes';
import { emailGateway } from '@/lib/email/email-services';
import { eventRepository } from '@/lib/events/event-services';
import { guestName, summariseResponse } from '@/lib/events/response-summary';

const LABEL_SEPARATOR = ' & ';

export type NotifyParams = {
	eventId: string;
	fields: FormFieldDefinition[];
	guests: { firstName: string; id: string; lastName: null | string }[];
	submission: Submission;
};

function invitationLabel(guests: NotifyParams['guests']): string {
	return guests.map(guestName).join(LABEL_SEPARATOR) || APP_CONFIG.app.name;
}

// runs after the guest already has their answer, so nothing here may throw into their request: a
// host without notifications, a missing address or a refusing mail provider all end quietly.
export async function notifyHostOfResponse(params: NotifyParams, gateway: EmailGateway = emailGateway): Promise<void> {
	try {
		const target = await eventRepository.findNotificationTarget(params.eventId);

		if (!target) {
			return;
		}

		const summary = summariseResponse(params);

		await gateway.send({
			answers: summary.answers,
			eventTitle: target.title,
			eventUrl: new URL(eventPath(params.eventId), SERVER_CONFIG.auth.origin).toString(),
			guests: summary.guests.map((guest) => ({
				answers: guest.answers,
				name: guest.name,
				status: guest.response,
			})),
			invitationLabel: invitationLabel(params.guests),
			kind: 'event-response',
			to: target.email,
		});
	} catch (error) {
		console.error('[event-response-email]', error instanceof Error ? error.message : error);
	}
}
