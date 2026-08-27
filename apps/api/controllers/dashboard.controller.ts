import { Controller, Inject } from '@tsed/di';
import { Get } from '@tsed/schema';
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

  @Get('/admin')
  @Authorized(AdminOnly())
  async admin() {
    return this.dashboardService.adminDashboard();
  }
}
