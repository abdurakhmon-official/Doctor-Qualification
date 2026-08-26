import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { Get, Post, Put } from '@tsed/schema';
import { CreateSpecialtyInputSchema, UpdateSpecialtyInputSchema } from '@/inputs/specialty.input';
import type { CreateSpecialtyInput, UpdateSpecialtyInput } from '@/inputs/specialty.input';
import { AdminOnly, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { SpecialtyService } from '@/services/specialty.service';

@Controller('/specialties')
export class SpecialtyController {
  @Inject()
  private specialtyService!: SpecialtyService;

  @Get('/')
  async list() {
    return this.specialtyService.list();
  }

  @Get('/admin')
  @Authorized(AdminOnly())
  async adminList() {
    return this.specialtyService.adminList();
  }

  @Post('/')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async create(@BodyParams() body: CreateSpecialtyInput) {
    return this.specialtyService.create(CreateSpecialtyInputSchema.parse(body));
  }

  @Put('/:specialtyId')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async update(@PathParams('specialtyId') specialtyId: string, @BodyParams() body: UpdateSpecialtyInput) {
    return this.specialtyService.update(specialtyId, UpdateSpecialtyInputSchema.parse(body));
  }
}
