import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams, QueryParams } from '@tsed/platform-params';
import { Get, Put } from '@tsed/schema';
import { SetActiveInputSchema, UpdateRoleInputSchema } from '@/inputs/user.input';
import type { SetActiveInput, UpdateRoleInput } from '@/inputs/user.input';
import { AdminOnly, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { UserService } from '@/services/user.service';

@Controller('/users')
export class UserController {
  @Inject()
  private userService!: UserService;

  @Get('/')
  @Authorized(AdminOnly())
  async list(@QueryParams() query: Record<string, unknown>) {
    return this.userService.list(query);
  }

  @Put('/:id/role')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async updateRole(@PathParams('id') id: string, @BodyParams() body: UpdateRoleInput) {
    const data = UpdateRoleInputSchema.parse(body);
    return this.userService.updateRole(id, data);
  }

  @Put('/:id/active')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async setActive(@PathParams('id') id: string, @BodyParams() body: SetActiveInput) {
    const data = SetActiveInputSchema.parse(body);
    return this.userService.setActive(id, data);
  }
}
