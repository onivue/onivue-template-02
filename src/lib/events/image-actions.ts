'use server';

import { revalidatePath } from 'next/cache';

import type { ActionResult } from '@/lib/events/action-result';

import { eventPath } from '@/config/routes';
import { getActiveMembership } from '@/lib/auth/active-organization';
import { accessFailure, failure, ok } from '@/lib/events/action-result';
import { eventAccess, eventRepository } from '@/lib/events/event-services';
import { checkImage, headerImageKey, isStoredKey, MAX_IMAGE_BYTES } from '@/lib/storage/object-storage';
import { objectStorage } from '@/lib/storage/s3-object-storage';

const PREVIEW_URL_TTL_SECONDS = 3600;

const MESSAGES = {
	noFile: 'Es wurde keine Datei ausgewählt.',
	notConfigured: 'Der Bildspeicher ist noch nicht eingerichtet.',
	tooLarge: `Das Bild ist größer als ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`,
	unsupported: 'Dieses Dateiformat wird nicht unterstützt. Erlaubt sind JPEG, PNG, WebP, AVIF und GIF.',
} as const;

// the old object is removed after the new one is stored: a failed cleanup costs disk space, a
// failed upload after a delete would cost the picture
async function replaceStoredImage(previous: null | string, next: null | string): Promise<void> {
	if (!objectStorage || !isStoredKey(previous) || previous === next) {
		return;
	}

	try {
		await objectStorage.remove(previous);
	} catch {
		// an orphaned object is not worth failing the request over
	}
}

export async function uploadHeaderImage(eventId: string, formData: FormData): Promise<ActionResult<{ url: string }>> {
	const membership = await getActiveMembership();
	const access = await eventAccess.forManaging(eventId, membership);

	if (!access.success) {
		return accessFailure(access.error);
	}

	if (!objectStorage) {
		return failure(MESSAGES.notConfigured);
	}

	const file = formData.get('file');

	if (!(file instanceof File) || file.size === 0) {
		return failure(MESSAGES.noFile);
	}

	const checked = checkImage(file.type, file.size);

	if (!checked.ok) {
		return failure(checked.reason === 'too-large' ? MESSAGES.tooLarge : MESSAGES.unsupported);
	}

	const event = await eventRepository.findEvent(eventId, membership.organizationId);
	const key = headerImageKey(eventId, checked.extension);

	await objectStorage.upload({
		body: new Uint8Array(await file.arrayBuffer()),
		contentType: file.type,
		key,
	});

	await eventRepository.updateEvent(eventId, { themeHeaderImageKey: key });
	await replaceStoredImage(event?.themeHeaderImageKey ?? null, key);

	revalidatePath(eventPath(eventId, 'design'));

	return ok({ url: await objectStorage.readUrl(key, PREVIEW_URL_TTL_SECONDS) });
}

export async function removeHeaderImage(eventId: string): Promise<ActionResult> {
	const membership = await getActiveMembership();
	const access = await eventAccess.forManaging(eventId, membership);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const event = await eventRepository.findEvent(eventId, membership.organizationId);

	await eventRepository.updateEvent(eventId, { themeHeaderImageKey: null });
	await replaceStoredImage(event?.themeHeaderImageKey ?? null, null);

	revalidatePath(eventPath(eventId, 'design'));

	return ok();
}
