import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams, QueryParams } from '@tsed/platform-params';
import { Delete, Get, Put } from '@tsed/schema';
import { AdminQuestionQuerySchema, UpdateQuestionInputSchema } from '@/inputs/question.input';
import type { UpdateQuestionInput } from '@/inputs/question.input';
import { AdminOnly, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { QuestionService } from '@/services/question.service';

@Controller('/questions')
export class QuestionController {
  @Inject()
  private questionService!: QuestionService;

  @Get('/')
  @Authorized(AdminOnly())
  async list(@QueryParams() query: Record<string, unknown>) {
    return this.questionService.adminList(AdminQuestionQuerySchema.parse(query));
  }

  @Put('/:questionId')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async update(@PathParams('questionId') questionId: string, @BodyParams() body: UpdateQuestionInput) {
    return this.questionService.update(questionId, UpdateQuestionInputSchema.parse(body));
  }

  @Delete('/:questionId')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async delete(@PathParams('questionId') questionId: string) {
    return this.questionService.delete(questionId);
  }
}
