import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams, QueryParams } from '@tsed/platform-params';
import { Delete, Get, Post, Put } from '@tsed/schema';
import { CreateExamInputSchema, UpdateExamInputSchema } from '@/inputs/exam.input';
import type { CreateExamInput, UpdateExamInput } from '@/inputs/exam.input';
import { CreateQuestionInputSchema } from '@/inputs/question.input';
import type { CreateQuestionInput } from '@/inputs/question.input';
import { AdminOnly, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { ExamService } from '@/services/exam.service';
import { QuestionService } from '@/services/question.service';

@Controller('/exams')
export class ExamController {
  @Inject()
  private examService!: ExamService;

  @Inject()
  private questionService!: QuestionService;

  @Get('/')
  @Authorized(AdminOnly())
  async list(@QueryParams() query: Record<string, unknown>) {
    return this.examService.adminList(query);
  }

  @Get('/:examId')
  @Authorized(AdminOnly())
  async get(@PathParams('examId') examId: string) {
    return this.examService.adminGet(examId);
  }

  @Post('/')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async create(@BodyParams() body: CreateExamInput) {
    return this.examService.create(CreateExamInputSchema.parse(body));
  }

  @Put('/:examId')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async update(@PathParams('examId') examId: string, @BodyParams() body: UpdateExamInput) {
    return this.examService.update(examId, UpdateExamInputSchema.parse(body));
  }

  @Delete('/:examId')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async delete(@PathParams('examId') examId: string) {
    return this.examService.delete(examId);
  }

  @Post('/:examId/questions')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async createQuestion(@PathParams('examId') examId: string, @BodyParams() body: CreateQuestionInput) {
    return this.questionService.create(examId, CreateQuestionInputSchema.parse(body));
  }
}
