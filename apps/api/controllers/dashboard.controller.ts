import { Controller, Inject } from '@tsed/di';
import { QueryParams } from '@tsed/platform-params';
import { Get } from '@tsed/schema';
import { UserProgressQuerySchema } from '@/inputs/dashboard.input';
import { AdminOnly, Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { DashboardService } from '@/services/dashboard.service';

@Controller('/dashboard')
export class DashboardController {
  @Inject()
  private dashboardService!: DashboardService;

  @Get('/public-stats')
  @RateLimit(RATE_LIMITS.public)
  async publicStats() {
    return this.dashboardService.publicStats();
  }

  @Get('/my')
  @Authorized(Authenticate())
  async my() {
    return this.dashboardService.myDashboard();
  }

  @Get('/my/progress')
  @Authorized(Authenticate())
  async myProgress(@QueryParams() query: Record<string, unknown>) {
    return this.dashboardService.myProgress(UserProgressQuerySchema.parse(query));
  }

  @Get('/admin')
  @Authorized(AdminOnly())
  async admin() {
    return this.dashboardService.adminDashboard();
  }
}
