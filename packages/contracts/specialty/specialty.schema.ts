import { z } from 'zod';
import { LocalizedTextSchema } from '../common/localized-text';
import type { LocalizedText } from '../common/localized-text';

// schemas

export const CreateSpecialtyInputSchema = z.object({
  name: LocalizedTextSchema,
  imageKey: z.string().nullable().optional(),
});

export const UpdateSpecialtyInputSchema = CreateSpecialtyInputSchema.partial().extend({
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// types

export type CreateSpecialtyInput = z.infer<typeof CreateSpecialtyInputSchema>;
export type UpdateSpecialtyInput = z.infer<typeof UpdateSpecialtyInputSchema>;

// interfaces

export interface SpecialtyOutput {
  id: string;
  name: LocalizedText;
  imageKey: string | null;
  isActive: boolean;
  order: number;
}
