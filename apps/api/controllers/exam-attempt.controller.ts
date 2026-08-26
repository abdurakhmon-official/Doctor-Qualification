import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { Get, Post, Put } from '@tsed/schema';
import { StartAttemptInputSchema, SubmitAttemptInputSchema } from '@/inputs/exam-attempt.input';
import type { StartAttemptInput, SubmitAttemptInput } from '@/inputs/exam-attempt.input';
import { Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { ExamAttemptService } from '@/services/exam-attempt.service';

@Controller('/exam-attempts')
export class ExamAttemptController {
  @Inject()
  private examAttemptService!: ExamAttemptService;

  @Get('/my')
  @Authorized(Authenticate())
  async myAttempts() {
    return this.examAttemptService.myAttempts();
  }

  @Get('/:attemptId')
  @Authorized(Authenticate())
  async get(@PathParams('attemptId') attemptId: string) {
    return this.examAttemptService.getAttempt(attemptId);
  }

  @Post('/')
  @Authorized(Authenticate())
  async start(@BodyParams() body: StartAttemptInput) {
    return this.examAttemptService.startAttempt(StartAttemptInputSchema.parse(body));
  }

  @Put('/:attemptId/submit')
  @Authorized(Authenticate())
  async submit(@PathParams('attemptId') attemptId: string, @BodyParams() body: SubmitAttemptInput) {
    return this.examAttemptService.submitAttempt(attemptId, SubmitAttemptInputSchema.parse(body));
  }
}
