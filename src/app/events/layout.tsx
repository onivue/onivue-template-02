import { type ReactNode } from 'react';

import { Layout } from '@/components/layout/layout';

// one shell for the whole events section: the list and every event page share it, so navigating
// between them never remounts the navigation
export default function EventsLayout({ children }: { children: ReactNode }) {
	return <Layout>{children}</Layout>;
}
