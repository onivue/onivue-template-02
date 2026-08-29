import type { Membership, OrganizationRole } from '@/lib/auth/personal-organization';
import type { EventStatus } from '@/lib/events/response-window';

// every read and write on an event goes through here. an event of another organization is reported
// as missing, not as forbidden: no member of one organization learns what another one is planning.

const ROLES_THAT_MAY_DELETE = new Set<OrganizationRole>(['owner', 'admin']);

export type AccessFailure = 'forbidden' | 'not-found';

export type AccessResult<T> = { data: T; success: true } | { error: AccessFailure; success: false };

export type EventSummary = {
	id: string;
	organizationId: string;
	status: EventStatus;
	title: string;
};

// narrow port over the single query this needs
export type EventLookup = {
	findEvent(eventId: string, organizationId: string): Promise<EventSummary | null>;
};

export class EventAccess {
	public constructor(private readonly lookup: EventLookup) {}

	// managing an event is open to every member of its organization
	public async forManaging(eventId: string, membership: Membership): Promise<AccessResult<EventSummary>> {
		const found = await this.lookup.findEvent(eventId, membership.organizationId);

		if (!found) {
			return { error: 'not-found', success: false };
		}

		return { data: found, success: true };
	}

	// deleting is final and takes the guest list with it, so it stays with owner and admin
	public async forDeleting(eventId: string, membership: Membership): Promise<AccessResult<EventSummary>> {
		const found = await this.forManaging(eventId, membership);

		if (!found.success) {
			return found;
		}

		if (!ROLES_THAT_MAY_DELETE.has(membership.role)) {
			return { error: 'forbidden', success: false };
		}

		return found;
	}
}
