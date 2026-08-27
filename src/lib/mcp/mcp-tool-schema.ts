import { z } from 'zod';

import { firstNameSchema, lastNameSchema, usernameSchema } from '@/lib/profile/profile-schema';

// no input beyond the caller's identity, which arrives via the bearer token, not the tool call
export const getProfileInputSchema = z.object({});

export const profileSchema = z.object({
	email: z.string(),
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	username: z.string().nullable(),
});

export const getProfileOutputSchema = z.object({
	profile: profileSchema,
});

// every field optional: the agent only sends what it wants changed, mirroring UpdateProfileParams
export const updateProfileInputSchema = z
	.object({
		firstName: firstNameSchema.optional(),
		lastName: lastNameSchema.optional(),
		username: usernameSchema.optional(),
	})
	.refine((value) => value.firstName !== undefined || value.lastName !== undefined || value.username !== undefined, {
		message: 'Gib mindestens ein Feld an, das geändert werden soll.',
	});

export const updateProfileOutputSchema = z.object({
	profile: profileSchema,
	updatedFields: z.array(z.enum(['firstName', 'lastName', 'username'])),
});

export type GetProfileOutput = z.infer<typeof getProfileOutputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type UpdateProfileOutput = z.infer<typeof updateProfileOutputSchema>;
