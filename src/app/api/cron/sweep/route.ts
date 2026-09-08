import { SERVER_CONFIG } from '@/config/env';
import { db } from '@/db/client';
import { DatabaseSweeper } from '@/lib/maintenance/database-sweeper';

const sweeper = new DatabaseSweeper(db);

const UNAUTHORIZED = 401;
const SWEEP_FAILED = 500;

// vercel sends `Authorization: Bearer $CRON_SECRET` with every scheduled invocation. the counts go
// back in the response because that is what shows up in the cron log: without them there is no way
// to tell a working sweep from one whose predicate stopped matching anything.
export async function GET(request: Request): Promise<Response> {
	const secret = SERVER_CONFIG.cron.secret;

	if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
		return new Response('Unauthorized', { status: UNAUTHORIZED });
	}

	const result = await sweeper.sweep();

	if (!result.success) {
		console.error('[cron-sweep]', result.error);

		return Response.json({ error: result.error }, { status: SWEEP_FAILED });
	}

	return Response.json(result.data);
}
