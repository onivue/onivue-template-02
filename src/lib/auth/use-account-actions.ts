'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
	AccountActions,
	type AccountActionName,
	type ActionOutcome,
	type AuthGateway,
	type UpdateNameParams,
} from '@/lib/auth/account-actions';
import { authGateway } from '@/lib/auth/auth-gateway';

export type AccountActionState = { status: 'idle' } | { status: 'busy'; action: AccountActionName; targetId?: string };

type UseAccountActionsOptions = {
	// supplied where a list has to be refetched after a mutation
	onDataChanged?: () => Promise<void>;
	// overridable so the hook can be driven against a fake in tests
	gateway?: AuthGateway;
};

async function noop(): Promise<void> {}

export function useAccountActions(options: UseAccountActionsOptions = {}) {
	const router = useRouter();
	const [state, setState] = useState<AccountActionState>({ status: 'idle' });

	const actions = new AccountActions(options.gateway ?? authGateway, {
		invalidate: options.onDataChanged ?? noop,
		navigate: {
			push: (route) => router.push(route),
			refresh: () => router.refresh(),
		},
		notify: {
			error: (message) => toast.error(message),
			success: (message) => toast.success(message),
		},
	});

	async function run(
		action: AccountActionName,
		targetId: string | undefined,
		operation: () => Promise<ActionOutcome>
	): Promise<ActionOutcome> {
		setState({ status: 'busy', action, targetId });

		try {
			return await operation();
		} finally {
			setState({ status: 'idle' });
		}
	}

	return {
		state,
		isBusy: state.status !== 'idle',
		isRunning: (action: AccountActionName, targetId?: string): boolean =>
			state.status === 'busy' &&
			state.action === action &&
			(targetId === undefined || state.targetId === targetId),
		addPasskey: async (name: string) =>
			await run('add-passkey', undefined, async () => await actions.addPasskey(name)),
		changeEmail: async (newEmail: string) =>
			await run('change-email', undefined, async () => await actions.changeEmail(newEmail)),
		changePassword: async (currentPassword: string, newPassword: string) =>
			await run(
				'change-password',
				undefined,
				async () => await actions.changePassword(currentPassword, newPassword)
			),
		deletePasskey: async (id: string) =>
			await run('delete-passkey', id, async () => await actions.deletePasskey(id)),
		register: async (email: string) => await run('register', undefined, async () => await actions.register(email)),
		requestPasswordReset: async (email: string) =>
			await run('request-password-reset', undefined, async () => await actions.requestPasswordReset(email)),
		resetPassword: async (newPassword: string, token: string) =>
			await run('reset-password', undefined, async () => await actions.resetPassword(newPassword, token)),
		sendLoginLink: async (email: string, requestedCallbackUrl: string | null) =>
			await run(
				'send-login-link',
				undefined,
				async () => await actions.sendLoginLink(email, requestedCallbackUrl)
			),
		signInWithPasskey: async () =>
			await run('sign-in-passkey', undefined, async () => await actions.signInWithPasskey()),
		signInWithPassword: async (email: string, password: string) =>
			await run('sign-in-password', undefined, async () => await actions.signInWithPassword(email, password)),
		signOut: async () => await run('sign-out', undefined, async () => await actions.signOut()),
		signUpWithPassword: async (email: string, password: string) =>
			await run('sign-up-password', undefined, async () => await actions.signUpWithPassword(email, password)),
		updateName: async (params: UpdateNameParams) =>
			await run('update-name', undefined, async () => await actions.updateName(params)),
		updateUsername: async (username: string) =>
			await run('update-username', undefined, async () => await actions.updateUsername(username)),
	};
}
