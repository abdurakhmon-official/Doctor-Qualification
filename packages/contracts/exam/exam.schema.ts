import { z } from 'zod';
import { LocalizedTextSchema } from '../common/localized-text';
import type { LocalizedText } from '../common/localized-text';
import type { QuestionOutput } from '../question/question.schema';

// schemas

export const ExamStatusSchema = z.enum(['DRAFT', 'PUBLISHED']);

export const CreateExamInputSchema = z.object({
  specialtyId: z.string().uuid(),
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  durationMinutes: z.coerce.number().int().positive().max(300),
  minCertificateScore: z.coerce.number().int().min(0).max(100),
});

export const UpdateExamInputSchema = CreateExamInputSchema.partial().extend({
  status: ExamStatusSchema.optional(),
});

export const AdminExamQuerySchema = z.object({
  specialtyId: z.string().uuid().optional(),
  status: ExamStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(50).default(20),
});

// types

export type ExamStatus = z.infer<typeof ExamStatusSchema>;
export type CreateExamInput = z.infer<typeof CreateExamInputSchema>;
export type UpdateExamInput = z.infer<typeof UpdateExamInputSchema>;
export type AdminExamQuery = z.infer<typeof AdminExamQuerySchema>;

// interfaces

export interface ExamOutput {
  id: string;
  specialtyId: string;
  specialtyName: LocalizedText;
  title: LocalizedText;
  description: LocalizedText | null;
  durationMinutes: number;
  minCertificateScore: number;
  status: ExamStatus;
  questionCount: number;
}

export interface AdminExamListItem {
  id: string;
  specialtyId: string;
  specialtyName: LocalizedText;
  title: LocalizedText;
  durationMinutes: number;
  minCertificateScore: number;
  status: ExamStatus;
  questionCount: number;
  createdAt: string;
}

export interface AdminExamDetail {
  id: string;
  specialtyId: string;
  title: LocalizedText;
  description: LocalizedText | null;
  durationMinutes: number;
  minCertificateScore: number;
  status: ExamStatus;
  questions: QuestionOutput[];
}
