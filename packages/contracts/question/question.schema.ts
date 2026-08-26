import { z } from 'zod';
import { LocalizedTextSchema } from '../common/localized-text';
import type { LocalizedText } from '../common/localized-text';

// schemas

export const QuestionDifficultySchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']);

export const QuestionOptionsSchema = z.array(LocalizedTextSchema).length(4);

export const CreateQuestionInputSchema = z.object({
  text: LocalizedTextSchema,
  options: QuestionOptionsSchema,
  correctIndex: z.coerce.number().int().min(0).max(3),
  difficulty: QuestionDifficultySchema,
  imageKey: z.string().nullable().optional(),
});

export const UpdateQuestionInputSchema = CreateQuestionInputSchema.partial();

// types

export type QuestionDifficulty = z.infer<typeof QuestionDifficultySchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionInputSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInputSchema>;

// interfaces

export interface QuestionOutput {
  id: string;
  examId: string;
  text: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  difficulty: QuestionDifficulty;
  imageKey: string | null;
  order: number;
}
