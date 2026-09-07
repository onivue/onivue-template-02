import { toast } from 'sonner';

import type { ActionResult } from '@/lib/events/action-result';

// every admin control does the same thing with a result: say what happened. one place, so no call
// site invents its own wording for a failure.
export async function report(action: Promise<ActionResult<unknown>>, message: string): Promise<void> {
	const result = await action;

	if (result.success) {
		toast.success(message);

		return;
	}

	toast.error(result.message);
}
