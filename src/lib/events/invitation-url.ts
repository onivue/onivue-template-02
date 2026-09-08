import 'server-only';
import { SERVER_CONFIG } from '@/config/env';
import { invitationPath } from '@/config/routes';

// the guest link as it goes into a message. the browser builds the same string from
// location.origin; on the server there is no request origin to trust, so it comes from config.
export function invitationUrl(token: string): string {
	return new URL(invitationPath(token), SERVER_CONFIG.auth.origin).toString();
}
