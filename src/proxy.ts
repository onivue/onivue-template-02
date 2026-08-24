import { NextResponse, type NextRequest } from 'next/server';

import { APP_ROUTES, getAccessFor } from '@/config/routes';
import { getViewerFrom } from '@/lib/auth/viewer';

function createLoginRedirect(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	url.pathname = APP_ROUTES.LOGIN;
	url.search = '';
	url.searchParams.set('callbackURL', request.nextUrl.pathname);

	return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const access = getAccessFor(pathname);

	if (access === 'public') {
		return NextResponse.next();
	}

	const viewer = await getViewerFrom(request.headers);

	if (access === 'guest') {
		if (viewer) {
			return NextResponse.redirect(new URL(APP_ROUTES.ACCOUNT, request.url));
		}

		return NextResponse.next();
	}

	if (!viewer) {
		return createLoginRedirect(request);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\..*).*)'],
};
