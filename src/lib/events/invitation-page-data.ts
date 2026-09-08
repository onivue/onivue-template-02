import 'server-only';
import { cache } from 'react';

import type { InvitationView } from '@/lib/events/invitation-repository';

import { invitationRepository } from '@/lib/events/event-services';
import { checkGuestPageLimit } from '@/lib/events/guest-actions';

export type InvitationPageState =
	| { status: 'available'; view: InvitationView }
	| { status: 'rate-limited' }
	| { status: 'unavailable' };

// the page and the metadata a messenger reads both need this invitation. react's cache keeps that to
// one lookup and one rate-limit hit per request, so a link preview cannot cost double or slip past
// the limit that makes guessing a token expensive.
export const loadInvitationPage = cache(async (token: string): Promise<InvitationPageState> => {
	if (!(await checkGuestPageLimit())) {
		return { status: 'rate-limited' };
	}

	const view = await invitationRepository.findByToken(token);

	return view ? { status: 'available', view } : { status: 'unavailable' };
});
