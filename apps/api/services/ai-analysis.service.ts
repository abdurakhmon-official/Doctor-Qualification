import Anthropic from '@anthropic-ai/sdk';
import { Injectable, InjectContext } from '@tsed/di';
import { $log, PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import type { AiStatusOutput, AnalysisKind, AttemptAnalysisOutput, Locale, QuestionDifficulty } from '@repo/contracts';
import config from '@/config';
import prisma from '@/modules/db';
import { getAiClient, isAiEnabled } from '@/modules/ai';
import { requireUserId } from '@/utils/errors.utils';
import { pickLocalized } from '@/utils/localized.utils';
import { competitionStatus } from '@/utils/competition.utils';
import { loadFrozenQuestions } from '@/utils/frozen-questions.utils';
import {
  AiInvalidOutputError,
  AiRefusedError,
  requestAnalysis,
  sanitizeAnalysis,
  type AnalysisContext,
  type AnalysisQuestion,
} from '@/utils/ai-analysis.utils';
import {
  AiAnalysisRefusedException,
  AiAttemptNotSubmittedException,
  AiCompetitionRunningException,
  AiDailyLimitException,
  AiNotConfiguredException,
  AiUnavailableException,
} from '@/exceptions/ai.exceptions';
import { AttemptForbiddenException, AttemptNotFoundException } from '@/exceptions/exam-attempt.exceptions';
import { Prisma } from '../generated/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

// types

interface RawQuestion {
  id: string;
  text: unknown;
  options: unknown;
  correctIndex: number;
  difficulty: QuestionDifficulty;
  topicId: string | null;
  topic: { name: unknown } | null;
}

interface AttemptSource {
  title: unknown;
  specialtyId: string;
  specialtyName: unknown;
  score: number;
  answers: Record<string, number>;
  questions: RawQuestion[];
}

type StoredContent = Pick<AttemptAnalysisOutput, 'summary' | 'mistakes' | 'studyPlan' | 'encouragement' | 'revealsCorrectAnswers'>;

@Injectable()
export class AiAnalysisService {
  @InjectContext()
  private context!: PlatformContext;

  private get userId(): string {
    return requireUserId(this.context.getRequest<Request>().user);
  }

  async status() {
    const data: AiStatusOutput = {
      enabled: isAiEnabled(),
      dailyLimit: config.ai.dailyLimit,
      usedToday: await this.usedToday(),
    };
    return { success: true, data };
  }

  /** `data: null` when none exists yet - a normal state for the result page, not an error. */
  async get(kind: AnalysisKind, attemptId: string, locale: Locale) {
    await this.loadSource(kind, attemptId);
    const existing = await prisma.attemptAnalysis.findUnique({ where: { kind_attemptId_locale: { kind, attemptId, locale } } });

    return { success: true, data: existing ? this.toOutput(existing) : null };
  }

  /** Returns the cached analysis, or makes one paid API call and stores it. */
  async generate(kind: AnalysisKind, attemptId: string, locale: Locale) {
    if (!isAiEnabled()) throw new AiNotConfiguredException();

    const source = await this.loadSource(kind, attemptId);
    const existing = await prisma.attemptAnalysis.findUnique({ where: { kind_attemptId_locale: { kind, attemptId, locale } } });
    if (existing) return { success: true, data: this.toOutput(existing) };

    if ((await this.usedToday()) >= config.ai.dailyLimit) throw new AiDailyLimitException(config.ai.dailyLimit);

    const analysisContext = await this.buildContext(source, locale);
    const result = await this.callModel(kind, attemptId, analysisContext);
    const clean = sanitizeAnalysis(result.output, analysisContext);
    if (clean.redacted) $log.warn({ event: 'AI_ANALYSIS_REDACTED', kind, attemptId, redacted: clean.redacted });

    const content: StoredContent = {
      summary: clean.summary,
      mistakes: clean.mistakes,
      studyPlan: clean.studyPlan,
      encouragement: clean.encouragement,
      revealsCorrectAnswers: analysisContext.revealCorrectAnswers,
    };

    try {
      const saved = await prisma.attemptAnalysis.create({
        data: {
          userId: this.userId,
          kind,
          attemptId,
          locale,
          content: content as unknown as Prisma.InputJsonValue,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        },
      });
      $log.info({ event: 'AI_ANALYSIS_CREATED', kind, attemptId, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens });
      return { success: true, data: this.toOutput(saved) };
    } catch (error) {
      // a parallel request for the same attempt and language won the insert: serve its copy
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const winner = await prisma.attemptAnalysis.findUniqueOrThrow({ where: { kind_attemptId_locale: { kind, attemptId, locale } } });
      return { success: true, data: this.toOutput(winner) };
    }
  }

  private async callModel(kind: AnalysisKind, attemptId: string, analysisContext: AnalysisContext) {
    try {
      return await requestAnalysis(getAiClient(), analysisContext, { model: config.ai.model });
    } catch (error) {
      if (error instanceof AiRefusedError) {
        $log.warn({ event: 'AI_ANALYSIS_REFUSED', kind, attemptId, category: error.message });
        throw new AiAnalysisRefusedException();
      }
      if (error instanceof AiInvalidOutputError) {
        $log.error({ event: 'AI_ANALYSIS_INVALID_OUTPUT', kind, attemptId, stopReason: error.message });
        throw new AiUnavailableException();
      }
      // most specific first: a bad key is a configuration problem, the rest are transient
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
        $log.error({ event: 'AI_AUTH_FAILED', status: error.status });
        throw new AiNotConfiguredException();
      }
      if (error instanceof Anthropic.APIError) {
        $log.error({ event: 'AI_API_ERROR', status: error.status, message: error.message });
        throw new AiUnavailableException();
      }
      throw error;
    }
  }

  private usedToday(): Promise<number> {
    return prisma.attemptAnalysis.count({ where: { userId: this.userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } } });
  }

  /** Loads a finished attempt the viewer owns, whatever its kind, in one shape. */
  private async loadSource(kind: AnalysisKind, attemptId: string): Promise<AttemptSource> {
    const questionSelect = { id: true, text: true, options: true, correctIndex: true, difficulty: true, topicId: true, topic: { select: { name: true } } };

    if (kind === 'EXAM') {
      const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        select: {
          userId: true,
          submittedAt: true,
          score: true,
          answers: true,
          exam: { select: { title: true, specialtyId: true, specialty: { select: { name: true } }, questions: { select: questionSelect, orderBy: { order: 'asc' } } } },
        },
      });
      this.assertOwnedAndSubmitted(attemptId, attempt);
      return {
        title: attempt!.exam.title,
        specialtyId: attempt!.exam.specialtyId,
        specialtyName: attempt!.exam.specialty.name,
        score: attempt!.score ?? 0,
        answers: (attempt!.answers as Record<string, number> | null) ?? {},
        questions: attempt!.exam.questions,
      };
    }

    if (kind === 'PRACTICE') {
      const attempt = await prisma.practiceAttempt.findUnique({
        where: { id: attemptId },
        select: { userId: true, submittedAt: true, score: true, answers: true, questionIds: true, specialtyId: true, specialty: { select: { name: true } } },
      });
      this.assertOwnedAndSubmitted(attemptId, attempt);
      return {
        title: attempt!.specialty.name,
        specialtyId: attempt!.specialtyId,
        specialtyName: attempt!.specialty.name,
        score: attempt!.score ?? 0,
        answers: (attempt!.answers as Record<string, number> | null) ?? {},
        questions: await loadFrozenQuestions(attempt!.questionIds),
      };
    }

    const entry = await prisma.competitionEntry.findUnique({
      where: { id: attemptId },
      select: {
        userId: true,
        submittedAt: true,
        score: true,
        answers: true,
        competition: { select: { title: true, specialtyId: true, questionIds: true, startsAt: true, endsAt: true, specialty: { select: { name: true } } } },
      },
    });
    this.assertOwnedAndSubmitted(attemptId, entry);
    // others may still be playing the same questions
    if (competitionStatus(entry!.competition) !== 'FINISHED') throw new AiCompetitionRunningException();

    return {
      title: entry!.competition.title,
      specialtyId: entry!.competition.specialtyId,
      specialtyName: entry!.competition.specialty.name,
      score: entry!.score ?? 0,
      answers: (entry!.answers as Record<string, number> | null) ?? {},
      questions: await loadFrozenQuestions(entry!.competition.questionIds),
    };
  }

  private assertOwnedAndSubmitted(attemptId: string, attempt: { userId: string; submittedAt: Date | null } | null): void {
    if (!attempt) throw new AttemptNotFoundException(attemptId);
    if (attempt.userId !== this.userId) throw new AttemptForbiddenException();
    if (!attempt.submittedAt) throw new AiAttemptNotSubmittedException();
  }

  private async buildContext(source: AttemptSource, locale: Locale): Promise<AnalysisContext> {
    const topics = await prisma.topic.findMany({
      where: { specialtyId: source.specialtyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { order: 'asc' },
    });

    const questions: AnalysisQuestion[] = source.questions.map((question, index) => ({
      number: index + 1,
      text: pickLocalized(question.text, locale),
      options: (question.options as unknown[]).map((option) => pickLocalized(option, locale)),
      selectedIndex: source.answers[question.id] ?? null,
      correctIndex: question.correctIndex,
      topicId: question.topicId,
      topicName: question.topic ? pickLocalized(question.topic.name, locale) : null,
      difficulty: question.difficulty,
    }));

    return {
      title: pickLocalized(source.title, locale),
      specialty: pickLocalized(source.specialtyName, locale),
      score: source.score,
      locale,
      questions,
      topics: topics.map((topic) => ({ id: topic.id, name: pickLocalized(topic.name, locale) })),
      revealCorrectAnswers: config.ai.revealCorrectAnswers,
    };
  }

  private toOutput(row: { kind: AnalysisKind; attemptId: string; locale: string; createdAt: Date; content: unknown }): AttemptAnalysisOutput {
    const content = row.content as StoredContent;
    return {
      kind: row.kind,
      attemptId: row.attemptId,
      locale: row.locale as Locale,
      createdAt: row.createdAt.toISOString(),
      ...content,
    };
  }
}
