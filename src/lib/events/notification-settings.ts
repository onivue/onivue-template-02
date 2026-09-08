// who gets told when a guest answers. the two fields are one setting, not two: a switch that is on
// with nowhere to send to would fail silently on every answer, so they are resolved together.

export type NotificationSettings = {
	email: null | string;
	enabled: boolean;
};

// partial by design: a caller flips the switch without repeating the address, or changes the
// address without touching the switch. an empty string clears the address.
export type NotificationPatch = {
	email?: string;
	enabled?: boolean;
};

export type NotificationResolution =
	| { reason: 'missing-email'; valid: false }
	| { settings: NotificationSettings; valid: true };

export function resolveNotificationSettings(
	current: NotificationSettings,
	patch: NotificationPatch
): NotificationResolution {
	const email = patch.email === undefined ? current.email : patch.email.trim() || null;
	const enabled = patch.enabled ?? current.enabled;

	if (enabled && !email) {
		return { reason: 'missing-email', valid: false };
	}

	return { settings: { email, enabled }, valid: true };
}
