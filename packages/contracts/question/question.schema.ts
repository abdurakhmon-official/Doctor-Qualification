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
  topicId: z.string().uuid().nullable().optional(),
});

export const UpdateQuestionInputSchema = CreateQuestionInputSchema.partial();

// keeps one import request well under the API's 1 MB JSON body limit
export const QUESTION_IMPORT_MAX_ROWS = 200;

export const ImportQuestionsInputSchema = z.object({
  questions: z.array(CreateQuestionInputSchema).min(1).max(QUESTION_IMPORT_MAX_ROWS),
});

/** `topicId: 'none'` selects questions that have no topic yet. */
export const AdminQuestionQuerySchema = z.object({
  specialtyId: z.string().uuid().optional(),
  topicId: z.union([z.string().uuid(), z.literal('none')]).optional(),
  difficulty: QuestionDifficultySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(50).default(20),
});

// types

export type QuestionDifficulty = z.infer<typeof QuestionDifficultySchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionInputSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInputSchema>;
export type ImportQuestionsInput = z.infer<typeof ImportQuestionsInputSchema>;
export type AdminQuestionQuery = z.infer<typeof AdminQuestionQuerySchema>;

// interfaces

export interface QuestionOutput {
  id: string;
  examId: string;
  topicId: string | null;
  text: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  difficulty: QuestionDifficulty;
  imageKey: string | null;
  order: number;
}

export interface AdminQuestionListItem extends QuestionOutput {
  examTitle: LocalizedText;
  specialtyId: string;
  specialtyName: LocalizedText;
  topicName: LocalizedText | null;
}

export interface ImportQuestionsOutput {
  imported: number;
}
