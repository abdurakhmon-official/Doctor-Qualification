// interfaces

export interface RatingSettingsOutput {
  avgScoreWeight: number;
  bestScoreWeight: number;
  consistencyWeight: number;
  attemptCountWeight: number;
  minAttemptsRequired: number;
}

export interface RatingEntry {
  rank: number;
  userId: string;
  fullName: string;
  compositeScore: number;
  avgScore: number;
  bestScore: number;
  attemptCount: number;
}
