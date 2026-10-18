import { z } from 'zod';
import type { LocalizedText } from '../common/localized-text';

// schemas

/** `tzOffset` follows `Date#getTimezoneOffset()`: minutes UTC minus local (Tashkent = -300). */
export const UserProgressQuerySchema = z.object({
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

// types

export type UserProgressQuery = z.input<typeof UserProgressQuerySchema>;

// interfaces

export interface ScoreByLabel {
  label: string;
  avgScore: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AdminDashboardOutput {
  userCount: number;
  specialtyCount: number;
  examCount: number;
  questionCount: number;
  certificateCount: number;
  todaySubmissions: number;
  avgScore: number;
  scoresBySpecialty: ScoreByLabel[];
  submissionsPerDay: TrendPoint[];
  userGrowth: TrendPoint[];
}

export interface UserDashboardOutput {
  avgScore: number;
  bestScore: number;
  attemptCount: number;
  certificateCount: number;
}

export interface TopicProgress {
  /** null groups a specialty's questions that have no topic yet. */
  topicId: string | null;
  topicName: LocalizedText | null;
  specialtyId: string;
  specialtyName: LocalizedText;
  correct: number;
  answered: number;
  /** 0–100, rounded. */
  accuracy: number;
}

export interface ProgressPoint {
  date: string;
  score: number;
  kind: 'EXAM' | 'PRACTICE';
}

/** Exams and practice combined; accuracy counts answered questions only. */
export interface UserProgressOutput {
  /** One point per correctly answered question. */
  points: number;
  answeredCount: number;
  topicsStudied: number;
  practiceCount: number;
  streakDays: number;
  activeToday: boolean;
  /** Weakest first. */
  topics: TopicProgress[];
  /** Oldest first, most recent results only. */
  timeline: ProgressPoint[];
}

export interface PublicStatsOutput {
  userCount: number;
  attemptCount: number;
  certificateCount: number;
  avgScore: number;
  popularSpecialties: { id: string; name: LocalizedText; attemptCount: number }[];
}
