'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
	AccountActions,
	type AccountActionName,
	type ActionOutcome,
	type AuthGateway,
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
		deletePasskey: async (id: string) =>
			await run('delete-passkey', id, async () => await actions.deletePasskey(id)),
		register: async (email: string) => await run('register', undefined, async () => await actions.register(email)),
		sendLoginLink: async (email: string, requestedCallbackUrl: string | null) =>
			await run(
				'send-login-link',
				undefined,
				async () => await actions.sendLoginLink(email, requestedCallbackUrl)
			),
		signInWithPasskey: async () =>
			await run('sign-in-passkey', undefined, async () => await actions.signInWithPasskey()),
		signOut: async () => await run('sign-out', undefined, async () => await actions.signOut()),
	};
}
