import { Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { startOfDay } from 'date-fns';
import type { AdminDashboardOutput, PublicStatsOutput, UserDashboardOutput } from '@repo/contracts';
import prisma from '@/modules/db';
import { requireUserId } from '@/utils/errors.utils';
import { averageScore, dailyTrend, groupAverageByLabel, trendRangeStart } from '@/utils/dashboard.utils';
import { pickLocalized } from '@/utils/localized.utils';
import { resolveRequestLocale } from '@/i18n/resolve-request-locale.utils';
import { USER_ROLE } from '../generated/prisma';

@Injectable()
export class DashboardService {
  @InjectContext()
  private context!: PlatformContext;

  private get request(): Request {
    return this.context.getRequest<Request>();
  }

  private get userId(): string {
    return requireUserId(this.request.user);
  }

  async myDashboard() {
    const [certificateCount, stats] = await Promise.all([
      prisma.certificate.count({ where: { userId: this.userId } }),
      prisma.examAttempt.aggregate({
        where: { userId: this.userId, submittedAt: { not: null } },
        _avg: { score: true },
        _max: { score: true },
        _count: { _all: true },
      }),
    ]);

    const data: UserDashboardOutput = {
      avgScore: Math.round(stats._avg.score ?? 0),
      bestScore: stats._max.score ?? 0,
      attemptCount: stats._count._all,
      certificateCount,
    };

    return { success: true, data };
  }

  async adminDashboard() {
    const rangeStart = trendRangeStart();
    const locale = resolveRequestLocale(this.request);

    const [userCount, specialtyCount, examCount, questionCount, certificateCount, todaySubmissions, scoredAttempts, newUsers] =
      await Promise.all([
        prisma.user.count({ where: { role: USER_ROLE.USER, deletedAt: null } }),
        prisma.specialty.count({ where: { isActive: true } }),
        prisma.exam.count(),
        prisma.question.count(),
        prisma.certificate.count({ where: { revoked: false } }),
        prisma.examAttempt.count({ where: { submittedAt: { gte: startOfDay(new Date()) } } }),
        prisma.examAttempt.findMany({
          where: { submittedAt: { not: null }, score: { not: null } },
          select: { score: true, submittedAt: true, exam: { select: { specialty: { select: { name: true } } } } },
        }),
        prisma.user.findMany({
          where: { role: USER_ROLE.USER, deletedAt: null, createdAt: { gte: rangeStart } },
          select: { createdAt: true },
        }),
      ]);

    const data: AdminDashboardOutput = {
      userCount,
      specialtyCount,
      examCount,
      questionCount,
      certificateCount,
      todaySubmissions,
      avgScore: averageScore(scoredAttempts.map((attempt) => attempt.score)),
      scoresBySpecialty: groupAverageByLabel(
        scoredAttempts.map((attempt) => ({ label: pickLocalized(attempt.exam.specialty.name, locale), score: attempt.score! })),
      ),
      submissionsPerDay: dailyTrend(scoredAttempts.filter((attempt) => attempt.submittedAt).map((attempt) => attempt.submittedAt!)),
      userGrowth: dailyTrend(newUsers.map((user) => user.createdAt)),
    };

    return { success: true, data };
  }

  async publicStats() {
    const [userCount, attemptCount, certificateCount, scoredAttempts, specialtyAttempts] = await Promise.all([
      prisma.user.count({ where: { role: USER_ROLE.USER, deletedAt: null } }),
      prisma.examAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.certificate.count({ where: { revoked: false } }),
      prisma.examAttempt.findMany({ where: { submittedAt: { not: null }, score: { not: null } }, select: { score: true } }),
      prisma.examAttempt.findMany({
        where: { submittedAt: { not: null } },
        select: { exam: { select: { specialtyId: true, specialty: { select: { name: true } } } } },
      }),
    ]);

    const data: PublicStatsOutput = {
      userCount,
      attemptCount,
      certificateCount,
      avgScore: averageScore(scoredAttempts.map((attempt) => attempt.score)),
      popularSpecialties: this.popularSpecialties(specialtyAttempts),
    };

    return { success: true, data };
  }

  private popularSpecialties(
    attempts: { exam: { specialtyId: string; specialty: { name: unknown } } }[],
  ): PublicStatsOutput['popularSpecialties'] {
    const counts = new Map<string, { name: unknown; count: number }>();

    for (const attempt of attempts) {
      const entry = counts.get(attempt.exam.specialtyId) ?? { name: attempt.exam.specialty.name, count: 0 };
      entry.count += 1;
      counts.set(attempt.exam.specialtyId, entry);
    }

    return Array.from(counts.entries())
      .map(([id, entry]) => ({ id, name: entry.name as PublicStatsOutput['popularSpecialties'][number]['name'], attemptCount: entry.count }))
      .sort((a, b) => b.attemptCount - a.attemptCount)
      .slice(0, 5);
  }
}
