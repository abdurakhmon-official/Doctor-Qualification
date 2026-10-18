import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import type { AdminQuestionListItem } from '@repo/contracts';
import prisma from '@/modules/db';
import { AuditService } from '@/services/audit.service';
import { TopicService } from '@/services/topic.service';
import { ExamNotFoundException } from '@/exceptions/exam.exceptions';
import { QuestionNotFoundException } from '@/exceptions/question.exceptions';
import type { AdminQuestionQuery, CreateQuestionInput, ImportQuestionsInput, UpdateQuestionInput } from '@/inputs/question.input';
import type { Prisma } from '../generated/prisma';

@Injectable()
export class QuestionService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private auditService!: AuditService;

  @Inject()
  private topicService!: TopicService;

  private static readonly SELECT = {
    id: true,
    examId: true,
    topicId: true,
    text: true,
    options: true,
    correctIndex: true,
    difficulty: true,
    imageKey: true,
    order: true,
  };

  private get actor() {
    const user = this.context.getRequest<Request>().user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  async adminList({ specialtyId, topicId, difficulty, page, size }: AdminQuestionQuery) {
    const where: Prisma.QuestionWhereInput = {
      ...(specialtyId ? { exam: { specialtyId } } : {}),
      ...(topicId ? { topicId: topicId === 'none' ? null : topicId } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        select: {
          ...QuestionService.SELECT,
          exam: { select: { title: true, specialtyId: true, specialty: { select: { name: true } } } },
          topic: { select: { name: true } },
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      prisma.question.count({ where }),
    ]);

    const data: AdminQuestionListItem[] = questions.map(({ exam, topic, ...question }) => ({
      ...(question as Omit<AdminQuestionListItem, 'examTitle' | 'specialtyId' | 'specialtyName' | 'topicName'>),
      examTitle: exam.title as AdminQuestionListItem['examTitle'],
      specialtyId: exam.specialtyId,
      specialtyName: exam.specialty.name as AdminQuestionListItem['specialtyName'],
      topicName: (topic?.name ?? null) as AdminQuestionListItem['topicName'],
    }));

    return { success: true, data, meta: { page, limit: size, total } };
  }

  async create(examId: string, input: CreateQuestionInput) {
    const exam = await this.findExamOrThrow(examId);
    await this.topicService.assertBelongToSpecialty([input.topicId], exam.specialtyId);

    const count = await prisma.question.count({ where: { examId } });

    const question = await prisma.question.create({
      data: { ...input, examId, order: count },
      select: QuestionService.SELECT,
    });

    return { success: true, data: question };
  }

  async import(examId: string, input: ImportQuestionsInput) {
    const exam = await this.findExamOrThrow(examId);
    await this.topicService.assertBelongToSpecialty(
      input.questions.map((question) => question.topicId),
      exam.specialtyId,
    );

    // count + createMany in one transaction so concurrent imports can't hand out the same `order`
    const imported = await prisma.$transaction(async (tx) => {
      const count = await tx.question.count({ where: { examId } });

      const result = await tx.question.createMany({
        data: input.questions.map((question, index) => ({ ...question, examId, order: count + index })),
      });

      return result.count;
    });

    await this.auditService.log({
      ...this.actor,
      action: 'QUESTIONS_IMPORTED',
      entityType: 'Exam',
      entityId: examId,
      after: { imported },
    });

    return { success: true, data: { imported } };
  }

  async update(questionId: string, input: UpdateQuestionInput) {
    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, exam: { select: { specialtyId: true } } },
    });
    if (!existing) throw new QuestionNotFoundException(questionId);

    await this.topicService.assertBelongToSpecialty([input.topicId], existing.exam.specialtyId);

    const question = await prisma.question.update({
      where: { id: questionId },
      data: input,
      select: QuestionService.SELECT,
    });

    return { success: true, data: question };
  }

  async delete(questionId: string) {
    const question = await prisma.question.findUnique({ where: { id: questionId }, select: { id: true } });
    if (!question) throw new QuestionNotFoundException(questionId);

    await prisma.question.delete({ where: { id: questionId } });

    return { success: true, data: null };
  }

  private async findExamOrThrow(examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true, specialtyId: true } });
    if (!exam) throw new ExamNotFoundException(examId);

    return exam;
  }
}
