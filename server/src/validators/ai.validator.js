import { z } from 'zod';

export const extractProfileSchema = z.object({
  text: z.string().min(5).max(2000),
  language: z.enum(['en', 'hi', 'hinglish']).optional().default('en'),
});
