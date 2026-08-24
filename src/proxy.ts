import { NextResponse, type NextRequest } from 'next/server';

import { APP_ROUTES } from '@/config/routes';
import { getViewerFrom } from '@/lib/auth/viewer';

const PUBLIC_PAGE_ROUTES = [APP_ROUTES.LANDING] as const;
const AUTH_PAGE_ROUTES = [APP_ROUTES.LOGIN, APP_ROUTES.REGISTER] as const;

function isRouteMatch(pathname: string, route: string): boolean {
	return pathname === route || pathname.startsWith(`${route}/`);
}

function isPublicPage(pathname: string): boolean {
	return PUBLIC_PAGE_ROUTES.some((route) => isRouteMatch(pathname, route));
}

function isAuthPage(pathname: string): boolean {
	return AUTH_PAGE_ROUTES.some((route) => isRouteMatch(pathname, route));
}

function createLoginRedirect(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	url.pathname = APP_ROUTES.LOGIN;
	url.search = '';
	url.searchParams.set('callbackURL', request.nextUrl.pathname);

	return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (isPublicPage(pathname)) {
		return NextResponse.next();
	}

	const viewer = await getViewerFrom(request.headers);

	if (isAuthPage(pathname)) {
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
