import { z } from 'zod';

export const chatMessageSchema = z.object({
  sessionId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => value && value.length > 0 ? value : undefined),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(2000, 'Message is too long'),
  schemeId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => value && value.length > 0 ? value : undefined),
});
