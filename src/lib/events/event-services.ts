import { db } from '@/db/client';
import { DrizzleEventLookup } from '@/lib/events/drizzle-event-lookup';
import { DrizzleRateLimitStore } from '@/lib/events/drizzle-rate-limit-store';
import { DrizzleResponseStore } from '@/lib/events/drizzle-response-store';
import { EventAccess } from '@/lib/events/event-access';
import { EventRepository } from '@/lib/events/event-repository';
import { InvitationRepository } from '@/lib/events/invitation-repository';
import { RateLimiter } from '@/lib/events/rate-limiter';
import { ResponseService } from '@/lib/events/response-service';

// the wiring point for this feature: the one file that knows which adapter goes behind which port.
// everything else takes its collaborators as arguments.

const clock = () => new Date();

export const eventRepository = new EventRepository(db);
export const invitationRepository = new InvitationRepository(db);
export const eventAccess = new EventAccess(new DrizzleEventLookup(db));
export const responseService = new ResponseService(new DrizzleResponseStore(db), clock);
export const guestRateLimiter = new RateLimiter(new DrizzleRateLimitStore(db), clock);
