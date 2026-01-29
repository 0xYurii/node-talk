import { z } from 'zod';

export const updateProfileSchema = z.object({
    username: z
        .string()
        .min(3)
        .max(20)
        .regex(/^[a-zA-Z0-9_-]+$/, 'Alphanumeric only'),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    isPrivate: z.coerce.boolean().optional().default(false),
});

// Infer the type from the schema so we don't have to write interface manually
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
