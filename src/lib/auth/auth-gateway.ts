'use client';

import type {
	AuthGateway,
	AuthGatewayResult,
	ChangePasswordParams,
	RequestPasswordResetParams,
	ResetPasswordParams,
	SendMagicLinkParams,
	SignInEmailParams,
	SignUpEmailParams,
	UpdateProfileParams,
} from '@/lib/auth/account-actions';

import { authClient } from '@/lib/auth/auth-client';

// production adapter: maps the narrow port onto the better-auth client
export const authGateway: AuthGateway = {
	addPasskey: async (params: { name: string }): Promise<AuthGatewayResult> =>
		await authClient.passkey.addPasskey(params),
	changeEmail: async (params: { callbackURL: string; newEmail: string }): Promise<AuthGatewayResult> =>
		await authClient.changeEmail(params),
	changePassword: async (params: ChangePasswordParams): Promise<AuthGatewayResult> =>
		await authClient.changePassword(params),
	deletePasskey: async (params: { id: string }): Promise<AuthGatewayResult> =>
		await authClient.passkey.deletePasskey(params),
	requestPasswordReset: async (params: RequestPasswordResetParams): Promise<AuthGatewayResult> =>
		await authClient.requestPasswordReset(params),
	resetPassword: async (params: ResetPasswordParams): Promise<AuthGatewayResult> =>
		await authClient.resetPassword(params),
	sendMagicLink: async (params: SendMagicLinkParams): Promise<AuthGatewayResult> =>
		await authClient.signIn.magicLink(params),
	signInEmail: async (params: SignInEmailParams): Promise<AuthGatewayResult> => await authClient.signIn.email(params),
	signInPasskey: async (): Promise<AuthGatewayResult> => await authClient.signIn.passkey(),
	signOut: async (): Promise<AuthGatewayResult> => await authClient.signOut(),
	signUpEmail: async (params: SignUpEmailParams): Promise<AuthGatewayResult> => await authClient.signUp.email(params),
	updateProfile: async (params: UpdateProfileParams): Promise<AuthGatewayResult> =>
		await authClient.updateUser(params),
};
