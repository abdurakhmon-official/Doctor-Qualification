import { z } from 'zod';

// schemas

export const LocalizedTextSchema = z.object({
  uz: z.string().min(1),
  ru: z.string().min(1),
  en: z.string().min(1),
});

// types

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
