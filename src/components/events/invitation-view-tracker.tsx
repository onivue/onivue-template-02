'use client';

import { useEffect, useRef } from 'react';

import { recordInvitationView } from '@/lib/events/guest-actions';

// has to run in the browser so a messenger's link preview is not counted as an opened invitation.
// the ref keeps it to one ping per mount, which also absorbs strict mode's double effect.
export function InvitationViewTracker({ token }: { token: string }) {
	const recorded = useRef(false);

	useEffect(() => {
		if (recorded.current) {
			return;
		}

		recorded.current = true;
		void recordInvitationView(token);
	}, [token]);

	return null;
}
