import { z } from 'zod';
import { LocalizedTextSchema, type LocalizedText } from '../common/localized-text';
import type { AttemptQuestion, AttemptReviewQuestion, AttemptTopicResult } from '../exam-attempt/exam-attempt.schema';

// schemas

export const CompetitionStatusSchema = z.enum(['UPCOMING', 'ACTIVE', 'FINISHED']);

export const COMPETITION_MIN_QUESTIONS = 5;
export const COMPETITION_MAX_QUESTIONS = 50;

export const CreateCompetitionInputSchema = z
  .object({
    specialtyId: z.string().uuid(),
    title: LocalizedTextSchema,
    description: LocalizedTextSchema.nullable().default(null),
    /** Empty = the whole specialty. */
    topicIds: z.array(z.string().uuid()).max(20).default([]),
    questionCount: z.coerce.number().int().min(COMPETITION_MIN_QUESTIONS).max(COMPETITION_MAX_QUESTIONS),
    durationMinutes: z.coerce.number().int().min(1).max(180),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((input) => input.endsAt > input.startsAt, { message: 'VALIDATION_COMPETITION_DATES', path: ['endsAt'] })
  .refine((input) => input.endsAt > new Date(), { message: 'VALIDATION_COMPETITION_ENDED', path: ['endsAt'] });

export const SubmitCompetitionEntryInputSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
});

// types

export type CompetitionStatus = z.infer<typeof CompetitionStatusSchema>;
export type CreateCompetitionInput = z.input<typeof CreateCompetitionInputSchema>;
export type SubmitCompetitionEntryInput = z.infer<typeof SubmitCompetitionEntryInputSchema>;

// interfaces

export interface MyCompetitionEntrySummary {
  status: 'IN_PROGRESS' | 'SUBMITTED';
  score: number | null;
  rank: number | null;
}

export interface CompetitionListItem {
  id: string;
  title: LocalizedText;
  description: LocalizedText | null;
  specialtyId: string;
  specialtyName: LocalizedText;
  status: CompetitionStatus;
  startsAt: string;
  endsAt: string;
  questionCount: number;
  durationMinutes: number;
  isWeekly: boolean;
  /** Finished entries only. */
  participantCount: number;
  myEntry: MyCompetitionEntrySummary | null;
}

export interface LeaderboardRow {
  rank: number;
  fullName: string;
  score: number;
  timeSpentSeconds: number;
  isMe: boolean;
}

export interface CompetitionDetail extends CompetitionListItem {
  /** Top of the table; the viewer's own row is appended when it falls outside it. */
  leaderboard: LeaderboardRow[];
}

export interface CompetitionEntryInProgress {
  status: 'IN_PROGRESS';
  id: string;
  competitionId: string;
  title: LocalizedText;
  /** Entry time limit, capped by the end of the competition. */
  deadline: string;
  questions: AttemptQuestion[];
}

export interface CompetitionEntryResult {
  status: 'SUBMITTED';
  id: string;
  competitionId: string;
  title: LocalizedText;
  score: number;
  correctCount: number;
  questionCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  /** True when time ran out before answers arrived; the entry then scores 0. */
  expired: boolean;
  rank: number;
  participantCount: number;
  topics: AttemptTopicResult[];
  questions: AttemptReviewQuestion[];
}

export type CompetitionEntryDetail = CompetitionEntryInProgress | CompetitionEntryResult;

export interface CompetitionBadge {
  competitionId: string;
  title: LocalizedText;
  specialtyName: LocalizedText;
  /** 1 = gold, 2 = silver, 3 = bronze. */
  rank: 1 | 2 | 3;
  endsAt: string;
}
