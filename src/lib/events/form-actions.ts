'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { ActionResult } from '@/lib/events/action-result';

import { eventPath } from '@/config/routes';
import { getActiveMembership } from '@/lib/auth/active-organization';
import { accessFailure, ACTION_MESSAGES, failure, ok } from '@/lib/events/action-result';
import { eventAccess, eventRepository } from '@/lib/events/event-services';

const CHOICE_TYPES = new Set(['checkbox', 'radio', 'select']);

const fieldSchema = z
	.object({
		helpText: z.string().max(200).optional(),
		label: z.string().trim().min(1, 'Die Frage braucht einen Text.').max(120, 'Die Frage ist zu lang.'),
		onlyWhenAttending: z.boolean(),
		// one option per line in the builder; ids are derived so answers survive a relabelling
		options: z.string().max(2000).optional(),
		required: z.boolean(),
		scope: z.enum(['guest', 'invitation']),
		type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox']),
	})
	.refine((field) => !CHOICE_TYPES.has(field.type) || (field.options?.trim().length ?? 0) > 0, {
		message: 'Für diese Feldart braucht es mindestens eine Auswahlmöglichkeit.',
		path: ['options'],
	});

function toOptionId(label: string, index: number): string {
	const slug = label
		.toLowerCase()
		.replaceAll('ä', 'ae')
		.replaceAll('ö', 'oe')
		.replaceAll('ü', 'ue')
		.replaceAll('ß', 'ss')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return slug || `option-${index + 1}`;
}

function toOptions(raw: string | undefined, type: string): { id: string; label: string }[] {
	if (!CHOICE_TYPES.has(type)) {
		return [];
	}

	const labels = (raw ?? '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	const seen = new Set<string>();

	return labels.map((label, index) => {
		let id = toOptionId(label, index);

		while (seen.has(id)) {
			id = `${id}-${index + 1}`;
		}

		seen.add(id);

		return { id, label };
	});
}

async function guard(eventId: string) {
	const membership = await getActiveMembership();

	return await eventAccess.forManaging(eventId, membership);
}

function revalidateForm(eventId: string): void {
	revalidatePath(eventPath(eventId, 'form'));
	revalidatePath(eventPath(eventId, 'design'));
}

export async function addFormField(eventId: string, input: z.input<typeof fieldSchema>): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const parsed = fieldSchema.safeParse(input);

	if (!parsed.success) {
		return failure(parsed.error.issues[0]?.message ?? ACTION_MESSAGES.invalid);
	}

	await eventRepository.createFormField(eventId, {
		helpText: parsed.data.helpText?.trim() || null,
		label: parsed.data.label,
		// an invitation has no response of its own, so the flag would never mean anything there
		onlyWhenAttending: parsed.data.scope === 'guest' && parsed.data.onlyWhenAttending,
		options: toOptions(parsed.data.options, parsed.data.type),
		required: parsed.data.required,
		scope: parsed.data.scope,
		type: parsed.data.type,
	});

	revalidateForm(eventId);

	return ok();
}

export async function updateFormField(
	eventId: string,
	fieldId: string,
	input: z.input<typeof fieldSchema>
): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	const parsed = fieldSchema.safeParse(input);

	if (!parsed.success) {
		return failure(parsed.error.issues[0]?.message ?? ACTION_MESSAGES.invalid);
	}

	await eventRepository.updateFormField(fieldId, {
		helpText: parsed.data.helpText?.trim() || null,
		label: parsed.data.label,
		onlyWhenAttending: parsed.data.scope === 'guest' && parsed.data.onlyWhenAttending,
		options: toOptions(parsed.data.options, parsed.data.type),
		required: parsed.data.required,
		scope: parsed.data.scope,
		type: parsed.data.type,
	});

	revalidateForm(eventId);

	return ok();
}

// retiring, not deleting: what people already answered stays readable in the table and the export
export async function retireFormField(eventId: string, fieldId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.retireFormField(fieldId);

	revalidateForm(eventId);

	return ok();
}

export async function moveFormField(eventId: string, fieldId: string, otherFieldId: string): Promise<ActionResult> {
	const access = await guard(eventId);

	if (!access.success) {
		return accessFailure(access.error);
	}

	await eventRepository.moveFormField(fieldId, otherFieldId);

	revalidateForm(eventId);

	return ok();
}
