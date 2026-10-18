import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { differenceInSeconds } from 'date-fns';
import type { z } from 'zod';
import type {
  LocalizedText,
  PracticeDetail,
  PracticeDifficulty,
  PracticeListItem,
  PracticeSubmitted,
  QuestionDifficulty,
} from '@repo/contracts';
import prisma from '@/modules/db';
import { requireUserId } from '@/utils/errors.utils';
import { gradeAttempt, gradeToLevel } from '@/utils/scoring.utils';
import { AUTO_HISTORY_SIZE, autoLevelsFor, pickQuestionIds } from '@/utils/practice.utils';
import { topicBreakdown } from '@/utils/topic-breakdown.utils';
import { loadFrozenQuestions, publishedPoolWhere, scoreOver, toAttemptQuestion, toReviewQuestion } from '@/utils/frozen-questions.utils';
import { SpecialtyService } from '@/services/specialty.service';
import { TopicService } from '@/services/topic.service';
import { PracticeNoQuestionsException } from '@/exceptions/practice.exceptions';
import {
  AttemptAlreadySubmittedException,
  AttemptForbiddenException,
  AttemptNotFoundException,
} from '@/exceptions/exam-attempt.exceptions';
import type { PracticeAvailabilityQuerySchema, StartPracticeInputSchema, SubmitPracticeInput } from '@/inputs/practice.input';
import type { Prisma } from '../generated/prisma';

type PracticeFilter = Pick<z.infer<typeof StartPracticeInputSchema>, 'specialtyId' | 'topicIds' | 'difficulty'>;

// practice is untimed; this only keeps a forgotten tab from recording days of "time spent"
const MAX_RECORDED_SECONDS = 24 * 60 * 60;
const HISTORY_LIMIT = 20;

@Injectable()
export class PracticeService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private specialtyService!: SpecialtyService;

  @Inject()
  private topicService!: TopicService;

  private get userId(): string {
    return requireUserId(this.context.getRequest<Request>().user);
  }

  async availability(query: z.infer<typeof PracticeAvailabilityQuerySchema>) {
    await this.assertFilter(query);

    const [available, autoLevels] = await Promise.all([
      prisma.question.count({ where: this.poolWhere(query) }),
      query.difficulty === 'AUTO' ? this.autoLevels(query.specialtyId) : Promise.resolve(null),
    ]);

    return { success: true, data: { available, autoLevels } };
  }

  async start(input: z.infer<typeof StartPracticeInputSchema>) {
    await this.assertFilter(input);

    const pool = await prisma.question.findMany({
      where: this.poolWhere(input),
      select: { id: true, difficulty: true },
    });
    if (!pool.length) throw new PracticeNoQuestionsException();

    const targetLevels = input.difficulty === 'AUTO' ? await this.autoLevels(input.specialtyId) : null;
    const questionIds = pickQuestionIds(pool, input.questionCount, targetLevels);

    const attempt = await prisma.practiceAttempt.create({
      data: {
        userId: this.userId,
        specialtyId: input.specialtyId,
        topicIds: input.topicIds,
        difficulty: input.difficulty,
        questionIds,
        questionCount: questionIds.length,
      },
      select: { id: true },
    });

    return { success: true, data: await this.detail(attempt.id) };
  }

  async get(attemptId: string) {
    await this.findOwned(attemptId);
    return { success: true, data: await this.detail(attemptId) };
  }

  async submit(attemptId: string, input: SubmitPracticeInput) {
    const attempt = await this.findOwned(attemptId);
    if (attempt.submittedAt) throw new AttemptAlreadySubmittedException(attemptId);

    const questions = await loadFrozenQuestions(attempt.questionIds);
    const questionIds = new Set(attempt.questionIds);
    const answers = Object.fromEntries(Object.entries(input.answers).filter(([questionId]) => questionIds.has(questionId)));

    const { correctCount } = gradeAttempt(questions, answers);
    const score = scoreOver(correctCount, attempt.questionCount);
    const now = new Date();

    // the submittedAt guard makes a double submit (two tabs, retry) a no-op instead of a second grading
    const { count } = await prisma.practiceAttempt.updateMany({
      where: { id: attemptId, submittedAt: null },
      data: {
        answers: answers as Prisma.InputJsonValue,
        score,
        correctCount,
        timeSpentSeconds: Math.min(differenceInSeconds(now, attempt.startedAt), MAX_RECORDED_SECONDS),
        submittedAt: now,
      },
    });
    if (count === 0) throw new AttemptAlreadySubmittedException(attemptId);

    return { success: true, data: await this.detail(attemptId) };
  }

  async my() {
    const attempts = await prisma.practiceAttempt.findMany({
      where: { userId: this.userId },
      select: {
        id: true,
        difficulty: true,
        questionCount: true,
        score: true,
        startedAt: true,
        submittedAt: true,
        specialty: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: HISTORY_LIMIT,
    });

    const data: PracticeListItem[] = attempts.map((attempt) => ({
      id: attempt.id,
      specialtyName: attempt.specialty.name as LocalizedText,
      difficulty: attempt.difficulty as PracticeDifficulty,
      questionCount: attempt.questionCount,
      score: attempt.score,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
    }));

    return { success: true, data };
  }

  private poolWhere({ specialtyId, topicIds, difficulty }: PracticeFilter): Prisma.QuestionWhereInput {
    return {
      ...publishedPoolWhere(specialtyId, topicIds),
      ...(difficulty !== 'AUTO' && difficulty !== 'MIXED' ? { difficulty } : {}),
    };
  }

  private async assertFilter({ specialtyId, topicIds }: PracticeFilter): Promise<void> {
    await this.specialtyService.assertExists(specialtyId);
    await this.topicService.assertBelongToSpecialty(topicIds, specialtyId);
  }

  /** Recent exam and practice scores in this specialty, newest first. */
  private async autoLevels(specialtyId: string): Promise<QuestionDifficulty[]> {
    const where = { userId: this.userId, submittedAt: { not: null }, score: { not: null } };

    const [practice, exams] = await Promise.all([
      prisma.practiceAttempt.findMany({
        where: { ...where, specialtyId },
        select: { score: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' },
        take: AUTO_HISTORY_SIZE,
      }),
      prisma.examAttempt.findMany({
        where: { ...where, exam: { specialtyId } },
        select: { score: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' },
        take: AUTO_HISTORY_SIZE,
      }),
    ]);

    const recent = [...practice, ...exams]
      .sort((a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime())
      .slice(0, AUTO_HISTORY_SIZE)
      .map((attempt) => attempt.score!);

    return autoLevelsFor(recent);
  }

  private async findOwned(attemptId: string) {
    const attempt = await prisma.practiceAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new AttemptNotFoundException(attemptId);
    if (attempt.userId !== this.userId) throw new AttemptForbiddenException();

    return attempt;
  }

  private async detail(attemptId: string): Promise<PracticeDetail> {
    const attempt = await prisma.practiceAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { specialty: { select: { name: true } } },
    });
    const questions = await loadFrozenQuestions(attempt.questionIds);
    const specialtyName = attempt.specialty.name as LocalizedText;
    const difficulty = attempt.difficulty as PracticeDifficulty;

    if (!attempt.submittedAt) {
      return {
        status: 'IN_PROGRESS',
        id: attempt.id,
        specialtyName,
        difficulty,
        startedAt: attempt.startedAt.toISOString(),
        questions: questions.map(toAttemptQuestion),
      };
    }

    const answers = (attempt.answers as Record<string, number> | null) ?? {};
    const score = attempt.score ?? 0;
    const result: PracticeSubmitted = {
      status: 'SUBMITTED',
      id: attempt.id,
      specialtyId: attempt.specialtyId,
      specialtyName,
      difficulty,
      topicIds: attempt.topicIds,
      score,
      correctCount: attempt.correctCount ?? 0,
      questionCount: attempt.questionCount,
      level: gradeToLevel(score),
      timeSpentSeconds: attempt.timeSpentSeconds ?? 0,
      submittedAt: attempt.submittedAt.toISOString(),
      topics: topicBreakdown(questions, answers),
      questions: questions.map((question) => toReviewQuestion(question, answers)),
    };

    return result;
  }
}
