import { Controller, Inject } from '@tsed/di';
import { PathParams, QueryParams } from '@tsed/platform-params';
import { Get, Put } from '@tsed/schema';
import { AdminOnly, Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { CertificateService } from '@/services/certificate.service';

@Controller('/certificates')
export class CertificateController {
  @Inject()
  private certificateService!: CertificateService;

  @Get('/my')
  @Authorized(Authenticate())
  async myCertificates() {
    return this.certificateService.myCertificates();
  }

  @Get('/admin')
  @Authorized(AdminOnly())
  async adminList(@QueryParams() query: Record<string, unknown>) {
    return this.certificateService.adminList(query);
  }

  @Get('/verify/:certificateId')
  @RateLimit(RATE_LIMITS.public)
  async verify(@PathParams('certificateId') certificateId: string) {
    return this.certificateService.verify(certificateId);
  }

  @Put('/:certificateId/revoke')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async revoke(@PathParams('certificateId') certificateId: string) {
    return this.certificateService.revoke(certificateId);
  }
}
