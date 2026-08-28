import { Controller, Inject } from '@tsed/di';
import { QueryParams } from '@tsed/platform-params';
import { Get } from '@tsed/schema';
import { AdminOnly, Authorized } from '@/middlewares/auth.middleware';
import { AuditService } from '@/services/audit.service';

@Controller('/audit-logs')
export class AuditController {
  @Inject()
  private auditService!: AuditService;

  @Get('/')
  @Authorized(AdminOnly())
  async list(@QueryParams() query: Record<string, unknown>) {
    return this.auditService.list(query);
  }
}
