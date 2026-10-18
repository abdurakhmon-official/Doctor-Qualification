import { z } from 'zod';
import { LocalizedTextSchema } from '../common/localized-text';
import type { LocalizedText } from '../common/localized-text';

// schemas

export const CreateTopicInputSchema = z.object({
  specialtyId: z.string().uuid(),
  name: LocalizedTextSchema,
});

export const UpdateTopicInputSchema = z.object({
  name: LocalizedTextSchema.optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const TopicQuerySchema = z.object({
  specialtyId: z.string().uuid().optional(),
});

// types

export type CreateTopicInput = z.infer<typeof CreateTopicInputSchema>;
export type UpdateTopicInput = z.infer<typeof UpdateTopicInputSchema>;
export type TopicQuery = z.infer<typeof TopicQuerySchema>;

// interfaces

export interface TopicOutput {
  id: string;
  specialtyId: string;
  name: LocalizedText;
  isActive: boolean;
  order: number;
  questionCount: number;
}
