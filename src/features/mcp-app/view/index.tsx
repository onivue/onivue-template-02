import { createRoot } from 'react-dom/client';

import { EventsApp } from '@/features/mcp-app/view/events-app';

const container = document.getElementById('root');

if (container) {
	createRoot(container).render(<EventsApp />);
}
