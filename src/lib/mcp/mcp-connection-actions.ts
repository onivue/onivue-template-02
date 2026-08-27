'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { headers } from 'next/headers';

import { db } from '@/db/client';
import { oauthAccessToken, oauthRefreshToken } from '@/db/schema';
import { auth } from '@/lib/auth/auth';
import { requireViewer } from '@/lib/auth/viewer';

export type RevokeMcpConnectionResult = { success: true } | { success: false; error: string };

// deleting the consent stops the client from getting new tokens, but tokens it already holds are
// signed JWTs that verify statelessly, so they are marked revoked here too. an access token already
// in flight stays usable until it expires (1h default) — the refresh token is what gets cut off.
async function revokeIssuedTokens(userId: string, clientId: string): Promise<void> {
	const revoked = new Date();

	await db
		.update(oauthRefreshToken)
		.set({ revoked })
		.where(
			and(
				eq(oauthRefreshToken.userId, userId),
				eq(oauthRefreshToken.clientId, clientId),
				isNull(oauthRefreshToken.revoked)
			)
		);

	await db
		.update(oauthAccessToken)
		.set({ revoked })
		.where(
			and(
				eq(oauthAccessToken.userId, userId),
				eq(oauthAccessToken.clientId, clientId),
				isNull(oauthAccessToken.revoked)
			)
		);
}

export async function revokeMcpConnection(consentId: string, clientId: string): Promise<RevokeMcpConnectionResult> {
	const viewer = await requireViewer();

	try {
		// the endpoint checks that the consent belongs to the signed-in user before deleting it
		await auth.api.deleteOAuthConsent({ body: { id: consentId }, headers: await headers() });
	} catch {
		return { success: false, error: 'Die Verbindung konnte nicht getrennt werden.' };
	}

	await revokeIssuedTokens(viewer.id, clientId);

	return { success: true };
}
