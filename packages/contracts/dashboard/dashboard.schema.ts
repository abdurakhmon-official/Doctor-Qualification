import type { LocalizedText } from '../common/localized-text';

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

export interface PublicStatsOutput {
  userCount: number;
  attemptCount: number;
  certificateCount: number;
  avgScore: number;
  popularSpecialties: { id: string; name: LocalizedText; attemptCount: number }[];
}
