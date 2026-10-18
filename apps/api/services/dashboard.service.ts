import { Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { startOfDay } from 'date-fns';
import type { z } from 'zod';
import type {
  AdminDashboardOutput,
  LocalizedText,
  ProgressPoint,
  PublicStatsOutput,
  TopicProgress,
  UserDashboardOutput,
  UserProgressOutput,
} from '@repo/contracts';
import type { UserProgressQuerySchema } from '@/inputs/dashboard.input';
import prisma from '@/modules/db';
import { requireUserId } from '@/utils/errors.utils';
import { averageScore, dailyTrend, groupAverageByLabel, trendRangeStart } from '@/utils/dashboard.utils';
import { activityStreak, tallyTopics } from '@/utils/progress.utils';
import { pickLocalized } from '@/utils/localized.utils';
import { resolveRequestLocale } from '@/i18n/resolve-request-locale.utils';
import { USER_ROLE } from '../generated/prisma';

// newest attempts of each kind that feed the cabinet; keeps the query bounded for very active users
const PROGRESS_HISTORY_LIMIT = 500;
const TIMELINE_POINTS = 30;

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

  async myProgress({ tzOffset }: z.infer<typeof UserProgressQuerySchema>) {
    const where = { userId: this.userId, submittedAt: { not: null }, score: { not: null } };
    const select = { answers: true, score: true, submittedAt: true };

    const [exams, practice] = await Promise.all([
      prisma.examAttempt.findMany({ where, select, orderBy: { submittedAt: 'desc' }, take: PROGRESS_HISTORY_LIMIT }),
      prisma.practiceAttempt.findMany({ where, select, orderBy: { submittedAt: 'desc' }, take: PROGRESS_HISTORY_LIMIT }),
    ]);

    const answerSets = [...exams, ...practice].map((attempt) => (attempt.answers as Record<string, number> | null) ?? {});
    const questionIds = [...new Set(answerSets.flatMap((answers) => Object.keys(answers)))];

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        correctIndex: true,
        topicId: true,
        topic: { select: { name: true } },
        exam: { select: { specialtyId: true, specialty: { select: { name: true } } } },
      },
    });

    const { tallies, correct, answered } = tallyTopics(
      answerSets,
      new Map(questions.map((question) => [question.id, { ...question, specialtyId: question.exam.specialtyId }])),
    );

    const topicNames = new Map(questions.map((question) => [question.topicId, question.topic?.name]));
    const specialtyNames = new Map(questions.map((question) => [question.exam.specialtyId, question.exam.specialty.name]));

    const topics: TopicProgress[] = tallies
      .map((tally) => ({
        topicId: tally.topicId,
        topicName: (tally.topicId ? topicNames.get(tally.topicId) : null) as LocalizedText | null,
        specialtyId: tally.specialtyId,
        specialtyName: specialtyNames.get(tally.specialtyId) as LocalizedText,
        correct: tally.correct,
        answered: tally.answered,
        accuracy: Math.round((tally.correct / tally.answered) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered);

    const events: ProgressPoint[] = [
      ...exams.map((attempt) => ({ date: attempt.submittedAt!.toISOString(), score: attempt.score!, kind: 'EXAM' as const })),
      ...practice.map((attempt) => ({ date: attempt.submittedAt!.toISOString(), score: attempt.score!, kind: 'PRACTICE' as const })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const data: UserProgressOutput = {
      points: correct,
      answeredCount: answered,
      topicsStudied: tallies.filter((tally) => tally.topicId !== null).length,
      practiceCount: practice.length,
      ...activityStreak(
        events.map((event) => new Date(event.date)),
        tzOffset,
      ),
      topics,
      timeline: events.slice(-TIMELINE_POINTS),
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
