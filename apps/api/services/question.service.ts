import { Inject, Injectable } from '@tsed/di';
import prisma from '@/modules/db';
import { ExamService } from '@/services/exam.service';
import { QuestionNotFoundException } from '@/exceptions/question.exceptions';
import type { CreateQuestionInput, UpdateQuestionInput } from '@/inputs/question.input';

@Injectable()
export class QuestionService {
  @Inject()
  private examService!: ExamService;

  private static readonly SELECT = {
    id: true,
    examId: true,
    text: true,
    options: true,
    correctIndex: true,
    difficulty: true,
    imageKey: true,
    order: true,
  };

  async create(examId: string, input: CreateQuestionInput) {
    await this.examService.assertExists(examId);

    const count = await prisma.question.count({ where: { examId } });

    const question = await prisma.question.create({
      data: { ...input, examId, order: count },
      select: QuestionService.SELECT,
    });

    return { success: true, data: question };
  }

  async update(questionId: string, input: UpdateQuestionInput) {
    await this.findOrThrow(questionId);

    const question = await prisma.question.update({
      where: { id: questionId },
      data: input,
      select: QuestionService.SELECT,
    });

    return { success: true, data: question };
  }

  async delete(questionId: string) {
    await this.findOrThrow(questionId);

    await prisma.question.delete({ where: { id: questionId } });

    return { success: true, data: null };
  }

  private async findOrThrow(questionId: string): Promise<void> {
    const question = await prisma.question.findUnique({ where: { id: questionId }, select: { id: true } });
    if (!question) throw new QuestionNotFoundException(questionId);
  }
}
