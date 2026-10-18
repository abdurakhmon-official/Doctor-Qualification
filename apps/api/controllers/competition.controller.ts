import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { Delete, Get, Post, Put } from '@tsed/schema';
import { CreateCompetitionInputSchema, SubmitCompetitionEntryInputSchema } from '@/inputs/competition.input';
import type { CreateCompetitionInput, SubmitCompetitionEntryInput } from '@/inputs/competition.input';
import { AdminOnly, Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { CompetitionService } from '@/services/competition.service';

@Controller('/competitions')
export class CompetitionController {
  @Inject()
  private competitionService!: CompetitionService;

  // static paths first so they are not captured by "/:competitionId"

  @Get('/')
  @Authorized(Authenticate())
  async list() {
    return this.competitionService.list();
  }

  @Get('/my/badges')
  @Authorized(Authenticate())
  async myBadges() {
    return this.competitionService.myBadges();
  }

  @Get('/admin')
  @Authorized(AdminOnly())
  async adminList() {
    return this.competitionService.adminList();
  }

  @Post('/')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async create(@BodyParams() body: CreateCompetitionInput) {
    return this.competitionService.create(CreateCompetitionInputSchema.parse(body));
  }

  @Get('/:competitionId')
  @Authorized(Authenticate())
  async detail(@PathParams('competitionId') competitionId: string) {
    return this.competitionService.detail(competitionId);
  }

  @Delete('/:competitionId')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async delete(@PathParams('competitionId') competitionId: string) {
    return this.competitionService.delete(competitionId);
  }

  @Get('/:competitionId/entry')
  @Authorized(Authenticate())
  async myEntry(@PathParams('competitionId') competitionId: string) {
    return this.competitionService.myEntry(competitionId);
  }

  @Post('/:competitionId/entry')
  @Authorized(Authenticate())
  @RateLimit(RATE_LIMITS.public)
  async startEntry(@PathParams('competitionId') competitionId: string) {
    return this.competitionService.startEntry(competitionId);
  }

  @Put('/:competitionId/entry/submit')
  @Authorized(Authenticate())
  async submitEntry(@PathParams('competitionId') competitionId: string, @BodyParams() body: SubmitCompetitionEntryInput) {
    return this.competitionService.submitEntry(competitionId, SubmitCompetitionEntryInputSchema.parse(body));
  }
}
