import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { subDays } from 'date-fns';
import { RatingQuerySchema } from '@repo/contracts';
import type { RatingPeriod } from '@repo/contracts';
import prisma from '@/modules/db';
import { requireUserId } from '@/utils/errors.utils';
import { computeUserRating } from '@/utils/rating.utils';
import { RatingSettingsService } from '@/services/rating-settings.service';

interface RankedUser {
  userId: string;
  fullName: string;
  avatar: string | null;
  avgScore: number;
  bestScore: number;
  attemptCount: number;
  compositeScore: number;
}

@Injectable()
export class RatingService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private ratingSettingsService!: RatingSettingsService;

  private get userId(): string {
    return requireUserId(this.context.getRequest<Request>().user);
  }

  async list(rawQuery: unknown) {
    const query = RatingQuerySchema.parse(rawQuery);
    const ranked = await this.computeRankings(query.specialtyId, query.period);

    const start = (query.page - 1) * query.size;
    const page = ranked.slice(start, start + query.size).map((user, index) => ({ rank: start + index + 1, ...user }));

    return {
      success: true,
      data: page,
      meta: { page: query.page, limit: query.size, total: ranked.length },
    };
  }

  async myRating(specialtyId: string) {
    const ranked = await this.computeRankings(specialtyId, 'all');
    const index = ranked.findIndex((entry) => entry.userId === this.userId);
    const mine = index === -1 ? undefined : ranked[index];

    return {
      success: true,
      data: {
        eligible: Boolean(mine),
        avgScore: mine?.avgScore ?? 0,
        bestScore: mine?.bestScore ?? 0,
        attemptCount: mine?.attemptCount ?? 0,
        rank: index === -1 ? null : index + 1,
        total: ranked.length,
      },
    };
  }

  private async computeRankings(specialtyId: string, period: RatingPeriod): Promise<RankedUser[]> {
    const settings = await this.ratingSettingsService.get();
    const periodStart = this.periodStartDate(period);

    const attempts = await prisma.examAttempt.findMany({
      where: {
        submittedAt: { not: null, ...(periodStart ? { gte: periodStart } : {}) },
        score: { not: null },
        exam: { specialtyId },
        user: { active: true, deletedAt: null },
      },
      select: {
        userId: true,
        score: true,
        user: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    const byUser = new Map<string, { user: (typeof attempts)[number]['user']; scores: number[] }>();

    for (const attempt of attempts) {
      if (attempt.score === null) continue;

      const bucket = byUser.get(attempt.userId) ?? { user: attempt.user, scores: [] };
      bucket.scores.push(attempt.score);
      byUser.set(attempt.userId, bucket);
    }

    const ranked: RankedUser[] = [];

    for (const [userId, bucket] of byUser) {
      if (bucket.scores.length < settings.minAttemptsRequired) continue;

      const computed = computeUserRating({ scores: bucket.scores }, settings);

      ranked.push({
        userId,
        fullName: bucket.user.fullName,
        avatar: bucket.user.avatar,
        ...computed,
      });
    }

    return ranked.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  private periodStartDate(period: RatingPeriod): Date | null {
    if (period === 'week') return subDays(new Date(), 7);
    if (period === 'month') return subDays(new Date(), 30);
    return null;
  }
}
