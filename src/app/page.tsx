import { redirect } from 'next/navigation';

import { APP_ROUTES } from '@/config/routes';

// the app has one purpose; a placeholder home in front of it would only cost a click
export default function Home() {
	redirect(APP_ROUTES.EVENTS);
}
