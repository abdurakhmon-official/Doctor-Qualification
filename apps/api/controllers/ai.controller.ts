import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams, QueryParams } from '@tsed/platform-params';
import { Get, Post } from '@tsed/schema';
import { AnalysisKindSchema, AnalysisLocaleInputSchema } from '@/inputs/ai.input';
import type { AnalysisLocaleInput } from '@/inputs/ai.input';
import { Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { AiAnalysisService } from '@/services/ai-analysis.service';

@Controller('/ai')
export class AiController {
  @Inject()
  private aiAnalysisService!: AiAnalysisService;

  @Get('/status')
  @Authorized(Authenticate())
  async status() {
    return this.aiAnalysisService.status();
  }

  @Get('/analysis/:kind/:attemptId')
  @Authorized(Authenticate())
  async get(
    @PathParams('kind') kind: string,
    @PathParams('attemptId') attemptId: string,
    @QueryParams() query: Record<string, unknown>,
  ) {
    const { locale } = AnalysisLocaleInputSchema.parse(query);
    return this.aiAnalysisService.get(AnalysisKindSchema.parse(kind), attemptId, locale);
  }

  @Post('/analysis/:kind/:attemptId')
  @Authorized(Authenticate())
  @RateLimit(RATE_LIMITS.public)
  async generate(@PathParams('kind') kind: string, @PathParams('attemptId') attemptId: string, @BodyParams() body: AnalysisLocaleInput) {
    const { locale } = AnalysisLocaleInputSchema.parse(body);
    return this.aiAnalysisService.generate(AnalysisKindSchema.parse(kind), attemptId, locale);
  }
}
