import { Injectable } from '@tsed/di';
import { AdminExamQuerySchema } from '@repo/contracts';
import prisma from '@/modules/db';
import { badRequest, notFound } from '@/utils/errors.utils';
import type { CreateExamInput, UpdateExamInput } from '@/inputs/exam.input';
import { EXAM_STATUS } from '../generated/prisma';

@Injectable()
export class ExamService {
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
      select: { id: true, examId: true, text: true, options: true, correctIndex: true, difficulty: true, imageKey: true, order: true },
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
    if (!exam) throw notFound('EXAM_NOT_FOUND', 'exam not found');

    return { success: true, data: exam };
  }

  async create(input: CreateExamInput) {
    await this.assertSpecialtyExists(input.specialtyId);

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

    return { success: true, data: exam };
  }

  async update(examId: string, input: UpdateExamInput) {
    const before = await prisma.exam.findUnique({ where: { id: examId }, select: ExamService.DETAIL_SELECT });
    if (!before) throw notFound('EXAM_NOT_FOUND', 'exam not found');

    if (input.specialtyId) await this.assertSpecialtyExists(input.specialtyId);

    if (input.status === EXAM_STATUS.PUBLISHED && before.questions.length === 0) {
      throw badRequest('EXAM_HAS_NO_QUESTIONS', 'an exam with no questions cannot be published');
    }

    const exam = await prisma.exam.update({
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

    return { success: true, data: exam };
  }

  async delete(examId: string) {
    const before = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
    if (!before) throw notFound('EXAM_NOT_FOUND', 'exam not found');

    await prisma.exam.delete({ where: { id: examId } });

    return { success: true, data: null };
  }

  private async assertSpecialtyExists(specialtyId: string): Promise<void> {
    const specialty = await prisma.specialty.findUnique({ where: { id: specialtyId }, select: { id: true } });
    if (!specialty) throw notFound('SPECIALTY_NOT_FOUND', 'specialty not found');
  }
}
