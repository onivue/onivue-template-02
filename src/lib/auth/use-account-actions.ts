'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { AccountActions, type AccountActionName, type AuthGateway } from '@/lib/auth/account-actions';
import { authGateway } from '@/lib/auth/auth-gateway';

export type AccountActionState = { status: 'idle' } | { status: 'busy'; action: AccountActionName; targetId?: string };

type UseAccountActionsOptions = {
	// supplied where a list has to be refetched after a mutation
	onDataChanged?: () => Promise<void>;
	// overridable so the hook can be driven against a fake in tests
	gateway?: AuthGateway;
};

type UseAccountActions = {
	actions: AccountActions;
	isBusy: boolean;
	isRunning(action: AccountActionName, targetId?: string): boolean;
};

async function noop(): Promise<void> {}

// module scope, so the hook body never touches window directly
function leaveApp(url: string): void {
	window.location.assign(url);
}

// binds AccountActions to React: it builds the four adapters and hands the module back. it does
// not re-declare the actions — see docs/adr/0003-busy-state-is-a-port.md
export function useAccountActions(options: UseAccountActionsOptions = {}): UseAccountActions {
	const router = useRouter();
	const [state, setState] = useState<AccountActionState>({ status: 'idle' });

	const actions = new AccountActions(options.gateway ?? authGateway, {
		busy: {
			finish: () => setState({ status: 'idle' }),
			start: (action, targetId) => setState({ status: 'busy', action, targetId }),
		},
		invalidate: options.onDataChanged ?? noop,
		navigate: {
			external: leaveApp,
			push: (route) => router.push(route),
			refresh: () => router.refresh(),
		},
		notify: {
			error: (message) => toast.error(message),
			success: (message) => toast.success(message),
		},
	});

	return {
		actions,
		isBusy: state.status !== 'idle',
		isRunning: (action: AccountActionName, targetId?: string): boolean =>
			state.status === 'busy' &&
			state.action === action &&
			(targetId === undefined || state.targetId === targetId),
	};
}
