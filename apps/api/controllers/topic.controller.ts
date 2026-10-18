import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams, QueryParams } from '@tsed/platform-params';
import { Get, Post, Put } from '@tsed/schema';
import { CreateTopicInputSchema, TopicQuerySchema, UpdateTopicInputSchema } from '@/inputs/topic.input';
import type { CreateTopicInput, UpdateTopicInput } from '@/inputs/topic.input';
import { AdminOnly, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { TopicService } from '@/services/topic.service';

@Controller('/topics')
export class TopicController {
  @Inject()
  private topicService!: TopicService;

  @Get('/')
  async list(@QueryParams() query: Record<string, unknown>) {
    return this.topicService.list(TopicQuerySchema.parse(query));
  }

  @Get('/admin')
  @Authorized(AdminOnly())
  async adminList(@QueryParams() query: Record<string, unknown>) {
    return this.topicService.adminList(TopicQuerySchema.parse(query));
  }

  @Post('/')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async create(@BodyParams() body: CreateTopicInput) {
    return this.topicService.create(CreateTopicInputSchema.parse(body));
  }

  @Put('/:topicId')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async update(@PathParams('topicId') topicId: string, @BodyParams() body: UpdateTopicInput) {
    return this.topicService.update(topicId, UpdateTopicInputSchema.parse(body));
  }
}
