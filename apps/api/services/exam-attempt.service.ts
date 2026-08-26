import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { differenceInSeconds } from 'date-fns';
import type { LocalizedText } from '@repo/contracts';
import prisma from '@/modules/db';
import { badRequest, forbidden, notFound, requireUserId } from '@/utils/errors.utils';
import { gradeAttempt, gradeToLevel } from '@/utils/scoring.utils';
import { CertificateService } from '@/services/certificate.service';
import { EXAM_STATUS, Prisma } from '../generated/prisma';
import type { StartAttemptInput, SubmitAttemptInput } from '@/inputs/exam-attempt.input';

@Injectable()
export class ExamAttemptService {
  private static readonly SUBMIT_GRACE_SECONDS = 30;

  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private certificateService!: CertificateService;

  private get user() {
    return this.context.getRequest<Request>().user;
  }

  private get userId(): string {
    return requireUserId(this.user);
  }

  async listPublished(specialtyId?: string) {
    const exams = await prisma.exam.findMany({
      where: { status: EXAM_STATUS.PUBLISHED, ...(specialtyId ? { specialtyId } : {}) },
      select: {
        id: true,
        specialtyId: true,
        title: true,
        description: true,
        durationMinutes: true,
        minCertificateScore: true,
        status: true,
        specialty: { select: { name: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: exams.map((exam) => ({
        id: exam.id,
        specialtyId: exam.specialtyId,
        specialtyName: exam.specialty.name,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        minCertificateScore: exam.minCertificateScore,
        status: exam.status,
        questionCount: exam._count.questions,
      })),
    };
  }

  async startAttempt(input: StartAttemptInput) {
    const exam = await prisma.exam.findUnique({
      where: { id: input.examId },
      select: {
        id: true,
        title: true,
        durationMinutes: true,
        minCertificateScore: true,
        status: true,
        questions: {
          select: { id: true, text: true, options: true, imageKey: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam || exam.status !== EXAM_STATUS.PUBLISHED) throw notFound('EXAM_NOT_FOUND', 'exam not found');
    if (exam.questions.length === 0) throw badRequest('EXAM_HAS_NO_QUESTIONS', 'an exam with no questions cannot be taken');

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        userId: this.userId,
        minCertificateScore: exam.minCertificateScore,
        questionCount: exam.questions.length,
      },
    });

    return {
      success: true,
      data: {
        status: 'IN_PROGRESS' as const,
        id: attempt.id,
        examId: exam.id,
        examTitle: exam.title,
        durationMinutes: exam.durationMinutes,
        startedAt: attempt.startedAt.toISOString(),
        questions: exam.questions,
      },
    };
  }

  async submitAttempt(attemptId: string, input: SubmitAttemptInput) {
    const attempt = await this.findOwnedInProgressAttempt(attemptId);

    const exam = await prisma.exam.findUniqueOrThrow({
      where: { id: attempt.examId },
      select: {
        id: true,
        title: true,
        durationMinutes: true,
        specialty: { select: { name: true } },
        questions: { select: { id: true, correctIndex: true } },
      },
    });

    const elapsedSeconds = differenceInSeconds(new Date(), attempt.startedAt);
    const allowedSeconds = exam.durationMinutes * 60;
    if (elapsedSeconds > allowedSeconds + ExamAttemptService.SUBMIT_GRACE_SECONDS) {
      throw badRequest('ATTEMPT_TIME_EXPIRED', 'the time allowed for this attempt has expired');
    }

    const validAnswers = this.pickValidAnswers(exam.questions, input.answers);
    const result = gradeAttempt(exam.questions, validAnswers);
    const level = gradeToLevel(result.score);

    const updated = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: validAnswers as unknown as Prisma.InputJsonValue,
        score: result.score,
        correctCount: result.correctCount,
        level,
        timeSpentSeconds: Math.min(elapsedSeconds, allowedSeconds),
        submittedAt: new Date(),
      },
    });

    let certificateIssued = false;
    if (result.score >= attempt.minCertificateScore) {
      certificateIssued = await this.certificateService.checkAndIssue({
        attemptId: attempt.id,
        userId: this.userId,
        examId: exam.id,
        userFullName: this.user!.fullName,
        specialtyName: exam.specialty.name as LocalizedText,
        score: result.score,
        level,
      });
    }

    return {
      success: true,
      data: {
        id: updated.id,
        examId: exam.id,
        examTitle: exam.title,
        score: result.score,
        correctCount: result.correctCount,
        questionCount: result.questionCount,
        level,
        minCertificateScore: attempt.minCertificateScore,
        certificateIssued,
        timeSpentSeconds: updated.timeSpentSeconds ?? 0,
        submittedAt: updated.submittedAt!.toISOString(),
      },
    };
  }

  async myAttempts() {
    const attempts = await prisma.examAttempt.findMany({
      where: { userId: this.userId, submittedAt: { not: null } },
      select: {
        id: true,
        examId: true,
        score: true,
        level: true,
        submittedAt: true,
        exam: { select: { title: true, specialty: { select: { name: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return {
      success: true,
      data: attempts.map((attempt) => ({
        id: attempt.id,
        examId: attempt.examId,
        examTitle: attempt.exam.title,
        specialtyName: attempt.exam.specialty.name,
        score: attempt.score ?? 0,
        level: attempt.level ?? 'BEGINNER',
        submittedAt: attempt.submittedAt!.toISOString(),
      })),
    };
  }

  async getAttempt(attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        certificate: { select: { id: true } },
        exam: {
          select: {
            title: true,
            durationMinutes: true,
            questions: {
              select: { id: true, text: true, options: true, imageKey: true, correctIndex: true, order: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!attempt) throw notFound('ATTEMPT_NOT_FOUND', 'attempt not found');
    if (attempt.userId !== this.userId) throw forbidden('ATTEMPT_FORBIDDEN', 'this attempt does not belong to you');

    if (!attempt.submittedAt) {
      return {
        success: true,
        data: {
          status: 'IN_PROGRESS' as const,
          id: attempt.id,
          examId: attempt.examId,
          examTitle: attempt.exam.title,
          durationMinutes: attempt.exam.durationMinutes,
          startedAt: attempt.startedAt.toISOString(),
          questions: attempt.exam.questions.map(({ id, text, options, imageKey, order }) => ({ id, text, options, imageKey, order })),
        },
      };
    }

    const answers = (attempt.answers as Record<string, number> | null) ?? {};

    return {
      success: true,
      data: {
        status: 'SUBMITTED' as const,
        id: attempt.id,
        examId: attempt.examId,
        examTitle: attempt.exam.title,
        score: attempt.score ?? 0,
        correctCount: attempt.correctCount ?? 0,
        questionCount: attempt.questionCount,
        level: attempt.level ?? 'BEGINNER',
        minCertificateScore: attempt.minCertificateScore,
        certificateIssued: Boolean(attempt.certificate),
        timeSpentSeconds: attempt.timeSpentSeconds ?? 0,
        submittedAt: attempt.submittedAt.toISOString(),
        questions: attempt.exam.questions.map((question) => ({
          text: question.text,
          options: question.options,
          selectedIndex: answers[question.id] ?? null,
          isCorrect: answers[question.id] === question.correctIndex,
        })),
      },
    };
  }

  private async findOwnedInProgressAttempt(attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw notFound('ATTEMPT_NOT_FOUND', 'attempt not found');
    if (attempt.userId !== this.userId) throw forbidden('ATTEMPT_FORBIDDEN', 'this attempt does not belong to you');
    if (attempt.submittedAt) throw badRequest('ATTEMPT_ALREADY_SUBMITTED', 'this attempt has already been submitted');

    return attempt;
  }

  private pickValidAnswers(questions: { id: string }[], answers: Record<string, number>): Record<string, number> {
    const questionIds = new Set(questions.map((question) => question.id));

    return Object.fromEntries(Object.entries(answers).filter(([questionId]) => questionIds.has(questionId)));
  }
}
