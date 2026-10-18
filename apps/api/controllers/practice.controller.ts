import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams, QueryParams } from '@tsed/platform-params';
import { Get, Post, Put } from '@tsed/schema';
import { PracticeAvailabilityQuerySchema, StartPracticeInputSchema, SubmitPracticeInputSchema } from '@/inputs/practice.input';
import type { StartPracticeInput, SubmitPracticeInput } from '@/inputs/practice.input';
import { Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { PracticeService } from '@/services/practice.service';

@Controller('/practice')
export class PracticeController {
  @Inject()
  private practiceService!: PracticeService;

  @Get('/availability')
  @Authorized(Authenticate())
  async availability(@QueryParams() query: Record<string, unknown>) {
    return this.practiceService.availability(PracticeAvailabilityQuerySchema.parse(query));
  }

  @Get('/my')
  @Authorized(Authenticate())
  async my() {
    return this.practiceService.my();
  }

  @Get('/:attemptId')
  @Authorized(Authenticate())
  async get(@PathParams('attemptId') attemptId: string) {
    return this.practiceService.get(attemptId);
  }

  @Post('/')
  @Authorized(Authenticate())
  @RateLimit(RATE_LIMITS.public)
  async start(@BodyParams() body: StartPracticeInput) {
    return this.practiceService.start(StartPracticeInputSchema.parse(body));
  }

  @Put('/:attemptId/submit')
  @Authorized(Authenticate())
  async submit(@PathParams('attemptId') attemptId: string, @BodyParams() body: SubmitPracticeInput) {
    return this.practiceService.submit(attemptId, SubmitPracticeInputSchema.parse(body));
  }
}
