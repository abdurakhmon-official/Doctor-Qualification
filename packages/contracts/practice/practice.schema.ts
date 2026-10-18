import { z } from 'zod';
import type { LocalizedText } from '../common/localized-text';
import type {
  AttemptQuestion,
  AttemptReviewQuestion,
  AttemptTopicResult,
  QualificationLevel,
} from '../exam-attempt/exam-attempt.schema';
import { QuestionDifficultySchema, type QuestionDifficulty } from '../question/question.schema';

// schemas

/** AUTO picks the level from the user's recent results; MIXED draws from every level. */
export const PracticeDifficultySchema = z.union([z.literal('AUTO'), z.literal('MIXED'), QuestionDifficultySchema]);

export const PRACTICE_QUESTION_COUNTS = [10, 20, 30, 50] as const;
export const PRACTICE_MAX_TOPICS = 20;

const PracticeFilterSchema = z.object({
  specialtyId: z.string().uuid(),
  /** Empty = all topics of the specialty, untagged questions included. */
  topicIds: z.array(z.string().uuid()).max(PRACTICE_MAX_TOPICS).default([]),
  difficulty: PracticeDifficultySchema.default('AUTO'),
});

export const StartPracticeInputSchema = PracticeFilterSchema.extend({
  questionCount: z.coerce.number().int().min(1).max(Math.max(...PRACTICE_QUESTION_COUNTS)),
});

export const PracticeAvailabilityQuerySchema = PracticeFilterSchema.extend({
  // query strings carry arrays as repeated or comma-separated values
  topicIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => (value === undefined ? [] : (Array.isArray(value) ? value : value.split(',')).filter(Boolean)))
    .pipe(z.array(z.string().uuid()).max(PRACTICE_MAX_TOPICS)),
});

export const SubmitPracticeInputSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
});

// types

export type PracticeDifficulty = z.infer<typeof PracticeDifficultySchema>;
export type StartPracticeInput = z.input<typeof StartPracticeInputSchema>;
export type PracticeAvailabilityQuery = z.input<typeof PracticeAvailabilityQuerySchema>;
export type SubmitPracticeInput = z.infer<typeof SubmitPracticeInputSchema>;

// interfaces

export interface PracticeAvailability {
  available: number;
  /** Levels AUTO would target right now; null when another mode is requested. */
  autoLevels: QuestionDifficulty[] | null;
}

export interface PracticeInProgress {
  status: 'IN_PROGRESS';
  id: string;
  specialtyName: LocalizedText;
  difficulty: PracticeDifficulty;
  startedAt: string;
  questions: AttemptQuestion[];
}

export type PracticeTopicResult = AttemptTopicResult;
export type PracticeReviewQuestion = AttemptReviewQuestion;

export interface PracticeSubmitted {
  status: 'SUBMITTED';
  id: string;
  specialtyId: string;
  specialtyName: LocalizedText;
  difficulty: PracticeDifficulty;
  topicIds: string[];
  score: number;
  correctCount: number;
  questionCount: number;
  level: QualificationLevel;
  timeSpentSeconds: number;
  submittedAt: string;
  topics: PracticeTopicResult[];
  questions: PracticeReviewQuestion[];
}

export type PracticeDetail = PracticeInProgress | PracticeSubmitted;

export interface PracticeListItem {
  id: string;
  specialtyName: LocalizedText;
  difficulty: PracticeDifficulty;
  questionCount: number;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
}
