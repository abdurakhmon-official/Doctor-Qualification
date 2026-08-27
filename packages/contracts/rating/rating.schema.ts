import { z } from 'zod';

// schemas

export const RatingPeriodSchema = z.enum(['all', 'week', 'month']);

export const RatingQuerySchema = z.object({
  specialtyId: z.string().uuid(),
  period: RatingPeriodSchema.default('all'),
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(50).default(20),
});

export const UpdateRatingSettingsInputSchema = z.object({
  avgScoreWeight: z.coerce.number().min(0).max(1),
  bestScoreWeight: z.coerce.number().min(0).max(1),
  consistencyWeight: z.coerce.number().min(0).max(1),
  attemptCountWeight: z.coerce.number().min(0).max(1),
  minAttemptsRequired: z.coerce.number().int().min(1).max(100),
});

// types

export type RatingPeriod = z.infer<typeof RatingPeriodSchema>;
export type RatingQuery = z.infer<typeof RatingQuerySchema>;
export type UpdateRatingSettingsInput = z.infer<typeof UpdateRatingSettingsInputSchema>;

// interfaces

export interface RatingSettingsOutput {
  avgScoreWeight: number;
  bestScoreWeight: number;
  consistencyWeight: number;
  attemptCountWeight: number;
  minAttemptsRequired: number;
}

export interface RatingListItem {
  rank: number;
  userId: string;
  fullName: string;
  avatar: string | null;
  avgScore: number;
  bestScore: number;
  attemptCount: number;
  compositeScore: number;
}

export interface MyRatingOutput {
  eligible: boolean;
  avgScore: number;
  bestScore: number;
  attemptCount: number;
  rank: number | null;
  total: number;
}
