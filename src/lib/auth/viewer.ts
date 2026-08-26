import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { APP_ROUTES } from '@/config/routes';
import { auth } from '@/lib/auth/auth';

export type Viewer = {
	email: string;
	firstName: string | null;
	id: string;
	image: string | null;
	lastName: string | null;
	name: string;
	username: string | null;
};

type SessionUser = {
	email: string;
	firstName?: string | null;
	id: string;
	image?: string | null;
	lastName?: string | null;
	name: string;
	username?: string | null;
};

// narrow port over better-auth's server api, so the resolution policy can be driven by a fake
export type SessionGateway = {
	getSession(params: { headers: Headers }): Promise<{ user: SessionUser } | null>;
};

function toViewer(user: SessionUser): Viewer {
	return {
		email: user.email,
		firstName: user.firstName ?? null,
		id: user.id,
		image: user.image ?? null,
		lastName: user.lastName ?? null,
		name: user.name,
		username: user.username ?? null,
	};
}

// the one place a failed session lookup is turned into "no viewer"
export async function resolveViewer(gateway: SessionGateway, requestHeaders: Headers): Promise<Viewer | null> {
	try {
		const session = await gateway.getSession({ headers: requestHeaders });

		if (!session) {
			return null;
		}

		return toViewer(session.user);
	} catch {
		return null;
	}
}

// proxy pass: runs before rendering, so it cannot share the cached lookup below
export async function getViewerFrom(requestHeaders: Headers): Promise<Viewer | null> {
	return await resolveViewer(auth.api, requestHeaders);
}

// render pass: deduped across every server component in a single request
export const getViewer = cache(async (): Promise<Viewer | null> => {
	return await resolveViewer(auth.api, await headers());
});

// narrows Viewer | null to Viewer; the proxy already gates these routes
export async function requireViewer(): Promise<Viewer> {
	const viewer = await getViewer();

	if (!viewer) {
		redirect(APP_ROUTES.LOGIN);
	}

	return viewer;
}
