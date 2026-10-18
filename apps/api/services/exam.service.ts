import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { AdminExamQuerySchema } from '@repo/contracts';
import prisma from '@/modules/db';
import { SpecialtyService } from '@/services/specialty.service';
import { AuditService } from '@/services/audit.service';
import type { CreateExamInput, UpdateExamInput } from '@/inputs/exam.input';
import { EXAM_STATUS } from '../generated/prisma';
import { ExamHasNoQuestionsException, ExamNotFoundException } from '@/exceptions/exam.exceptions';

@Injectable()
export class ExamService {
  @Inject()
  private specialtyService!: SpecialtyService;

  @Inject()
  private auditService!: AuditService;

  @InjectContext()
  private context!: PlatformContext;

  private get actor() {
    const user = this.context.getRequest<Request>().user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  private static readonly LIST_SELECT = {
    id: true,
    specialtyId: true,
    title: true,
    durationMinutes: true,
    minCertificateScore: true,
    status: true,
    createdAt: true,
    specialty: { select: { name: true } },
    _count: { select: { questions: true } },
  };

  private static readonly DETAIL_SELECT = {
    id: true,
    specialtyId: true,
    title: true,
    description: true,
    durationMinutes: true,
    minCertificateScore: true,
    status: true,
    questions: {
      select: {
        id: true,
        examId: true,
        topicId: true,
        text: true,
        options: true,
        correctIndex: true,
        difficulty: true,
        imageKey: true,
        order: true,
      },
      orderBy: { order: 'asc' as const },
    },
  };

  async adminList(rawQuery: unknown) {
    const { specialtyId, status, page, size } = AdminExamQuerySchema.parse(rawQuery);

    const where = {
      ...(specialtyId ? { specialtyId } : {}),
      ...(status ? { status } : {}),
    };

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        select: ExamService.LIST_SELECT,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exam.count({ where }),
    ]);

    return {
      success: true,
      data: exams.map((exam) => ({
        id: exam.id,
        specialtyId: exam.specialtyId,
        specialtyName: exam.specialty.name,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        minCertificateScore: exam.minCertificateScore,
        status: exam.status,
        questionCount: exam._count.questions,
        createdAt: exam.createdAt.toISOString(),
      })),
      meta: { page, limit: size, total },
    };
  }

  async adminGet(examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: ExamService.DETAIL_SELECT });
    if (!exam) throw new ExamNotFoundException(examId);

    return { success: true, data: exam };
  }

  async create(input: CreateExamInput) {
    await this.specialtyService.assertExists(input.specialtyId);

    const exam = await prisma.exam.create({
      data: {
        specialtyId: input.specialtyId,
        title: input.title,
        description: input.description,
        durationMinutes: input.durationMinutes,
        minCertificateScore: input.minCertificateScore,
      },
      select: ExamService.DETAIL_SELECT,
    });

    await this.auditService.log({
      ...this.actor,
      action: 'EXAM_CREATED',
      entityType: 'Exam',
      entityId: exam.id,
      after: exam,
    });

    return { success: true, data: exam };
  }

  async update(examId: string, input: UpdateExamInput) {
    const before = await prisma.exam.findUnique({ where: { id: examId }, select: ExamService.DETAIL_SELECT });
    if (!before) throw new ExamNotFoundException(examId);

    if (input.specialtyId) await this.specialtyService.assertExists(input.specialtyId);

    if (input.status === EXAM_STATUS.PUBLISHED && before.questions.length === 0) {
      throw new ExamHasNoQuestionsException(examId);
    }

    const specialtyChanged = input.specialtyId !== undefined && input.specialtyId !== before.specialtyId;

    const exam = await prisma.$transaction(async (tx) => {
      // topics are specialty-scoped, so a specialty move would leave questions filed under foreign topics
      if (specialtyChanged) {
        await tx.question.updateMany({ where: { examId }, data: { topicId: null } });
      }

      return tx.exam.update({
        where: { id: examId },
        data: {
          specialtyId: input.specialtyId,
          title: input.title,
          description: input.description,
          durationMinutes: input.durationMinutes,
          minCertificateScore: input.minCertificateScore,
          status: input.status,
        },
        select: ExamService.DETAIL_SELECT,
      });
    });

    await this.auditService.log({
      ...this.actor,
      action: 'EXAM_UPDATED',
      entityType: 'Exam',
      entityId: exam.id,
      before,
      after: exam,
    });

    return { success: true, data: exam };
  }

  async delete(examId: string) {
    const before = await prisma.exam.findUnique({ where: { id: examId }, select: ExamService.DETAIL_SELECT });
    if (!before) throw new ExamNotFoundException(examId);

    await prisma.exam.delete({ where: { id: examId } });

    await this.auditService.log({
      ...this.actor,
      action: 'EXAM_DELETED',
      entityType: 'Exam',
      entityId: examId,
      before,
    });

    return { success: true, data: null };
  }

  async assertExists(examId: string): Promise<void> {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
    if (!exam) throw new ExamNotFoundException(examId);
  }

  async getDetailForAttempt(examId: string) {
    return prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        durationMinutes: true,
        minCertificateScore: true,
        status: true,
        specialtyId: true,
        specialty: { select: { name: true } },
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            correctIndex: true,
            imageKey: true,
            order: true,
            difficulty: true,
            topicId: true,
            topic: { select: { name: true } },
          },
          orderBy: { order: 'asc' as const },
        },
      },
    });
  }
}
