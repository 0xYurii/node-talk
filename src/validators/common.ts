import { z } from 'zod';

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200),
    q: z
        .string()
        .trim()
        .transform((v) => (v === '' ? undefined : v))
        .optional()
        .refine((v) => v === undefined || /^[a-zA-Z0-9._]+$/.test(v), 'Invalid search query'),
});

export const usernameParamSchema = z.object({
    username: z
        .string()
        .min(3)
        .max(20)
        .regex(/^[a-zA-Z0-9_.]+$/, 'Alphanumeric only'),
});
