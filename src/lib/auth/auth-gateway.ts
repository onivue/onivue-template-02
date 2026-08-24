'use client';

import type { AuthGateway, AuthGatewayResult, SendMagicLinkParams } from '@/lib/auth/account-actions';

import { authClient } from '@/lib/auth/auth-client';

// production adapter: maps the narrow port onto the better-auth client
export const authGateway: AuthGateway = {
	addPasskey: async (params: { name: string }): Promise<AuthGatewayResult> =>
		await authClient.passkey.addPasskey(params),
	changeEmail: async (params: { callbackURL: string; newEmail: string }): Promise<AuthGatewayResult> =>
		await authClient.changeEmail(params),
	deletePasskey: async (params: { id: string }): Promise<AuthGatewayResult> =>
		await authClient.passkey.deletePasskey(params),
	sendMagicLink: async (params: SendMagicLinkParams): Promise<AuthGatewayResult> =>
		await authClient.signIn.magicLink(params),
	signInPasskey: async (): Promise<AuthGatewayResult> => await authClient.signIn.passkey(),
	signOut: async (): Promise<AuthGatewayResult> => await authClient.signOut(),
};
