'use client';

import { passkeyClient } from '@better-auth/passkey/client';
import { inferAdditionalFields, magicLinkClient, usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { PROFILE_ADDITIONAL_FIELDS } from '@/lib/profile/profile-schema';

export const authClient = createAuthClient({
	plugins: [
		magicLinkClient(),
		passkeyClient(),
		usernameClient(),
		inferAdditionalFields({ user: PROFILE_ADDITIONAL_FIELDS }),
	],
});
