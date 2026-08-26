import { z } from 'zod';
import type { LocalizedText } from '../common/localized-text';

// schemas

export const StartAttemptInputSchema = z.object({
  examId: z.string().uuid(),
});

export const SubmitAttemptInputSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
});

// types

export type QualificationLevel = 'BEGINNER' | 'INTERMEDIATE' | 'GOOD' | 'HIGH' | 'EXPERT';
export type StartAttemptInput = z.infer<typeof StartAttemptInputSchema>;
export type SubmitAttemptInput = z.infer<typeof SubmitAttemptInputSchema>;

// interfaces

export interface AttemptQuestion {
  id: string;
  text: LocalizedText;
  options: LocalizedText[];
  imageKey: string | null;
  order: number;
}

export interface AttemptInProgress {
  status: 'IN_PROGRESS';
  id: string;
  examId: string;
  examTitle: LocalizedText;
  durationMinutes: number;
  startedAt: string;
  questions: AttemptQuestion[];
}

export interface AttemptReviewQuestion {
  text: LocalizedText;
  options: LocalizedText[];
  selectedIndex: number | null;
  isCorrect: boolean;
}

export interface AttemptSubmitted {
  status: 'SUBMITTED';
  id: string;
  examId: string;
  examTitle: LocalizedText;
  score: number;
  correctCount: number;
  questionCount: number;
  level: QualificationLevel;
  minCertificateScore: number;
  certificateIssued: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
  questions: AttemptReviewQuestion[];
}

export type AttemptDetail = AttemptInProgress | AttemptSubmitted;

export interface SubmitAttemptResult {
  id: string;
  examId: string;
  examTitle: LocalizedText;
  score: number;
  correctCount: number;
  questionCount: number;
  level: QualificationLevel;
  minCertificateScore: number;
  certificateIssued: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
}

export interface MyAttemptListItem {
  id: string;
  examId: string;
  examTitle: LocalizedText;
  specialtyName: LocalizedText;
  score: number;
  level: QualificationLevel;
  submittedAt: string;
}

export interface ExamAttemptOutput {
  id: string;
  examId: string;
  userId: string;
  questionCount: number;
  score: number | null;
  correctCount: number | null;
  level: QualificationLevel | null;
  timeSpentSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
}
