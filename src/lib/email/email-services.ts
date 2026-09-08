import 'server-only';
import { SERVER_CONFIG } from '@/config/env';
import { createResendTransport, ResendGateway } from '@/lib/email/resend-gateway';

// the one wiring point for outgoing mail: auth and events share this transport rather than each
// opening their own
export const emailGateway = new ResendGateway({
	from: SERVER_CONFIG.mail.from,
	transport: createResendTransport(SERVER_CONFIG.mail.resendApiKey),
});
