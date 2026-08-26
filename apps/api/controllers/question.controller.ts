import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { Delete, Put } from '@tsed/schema';
import { UpdateQuestionInputSchema } from '@/inputs/question.input';
import type { UpdateQuestionInput } from '@/inputs/question.input';
import { AdminOnly, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { QuestionService } from '@/services/question.service';

@Controller('/questions')
export class QuestionController {
  @Inject()
  private questionService!: QuestionService;

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
