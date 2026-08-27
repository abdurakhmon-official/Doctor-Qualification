import { Controller, Inject } from '@tsed/di';
import { BodyParams, QueryParams } from '@tsed/platform-params';
import { Get, Put } from '@tsed/schema';
import { UpdateRatingSettingsInputSchema } from '@/inputs/rating.input';
import type { UpdateRatingSettingsInput } from '@/inputs/rating.input';
import { AdminOnly, Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { RatingService } from '@/services/rating.service';
import { RatingSettingsService } from '@/services/rating-settings.service';

@Controller('/ratings')
export class RatingController {
  @Inject()
  private ratingService!: RatingService;

  @Inject()
  private ratingSettingsService!: RatingSettingsService;

  @Get('/')
  async list(@QueryParams() query: Record<string, unknown>) {
    return this.ratingService.list(query);
  }

  @Get('/me')
  @Authorized(Authenticate())
  async myRating(@QueryParams('specialtyId') specialtyId: string) {
    return this.ratingService.myRating(specialtyId);
  }

  @Get('/settings')
  @Authorized(AdminOnly())
  async getSettings() {
    return { success: true, data: await this.ratingSettingsService.get() };
  }

  @Put('/settings')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async updateSettings(@BodyParams() body: UpdateRatingSettingsInput) {
    const data = UpdateRatingSettingsInputSchema.parse(body);
    return { success: true, data: await this.ratingSettingsService.update(data) };
  }
}
