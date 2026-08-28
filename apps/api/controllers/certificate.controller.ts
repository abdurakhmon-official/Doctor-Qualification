import { Controller, Inject } from '@tsed/di';
import { BodyParams, PathParams, QueryParams } from '@tsed/platform-params';
import { Get, Put } from '@tsed/schema';
import { UpdateCertificateTemplateInputSchema } from '@/inputs/certificate.input';
import type { UpdateCertificateTemplateInput } from '@/inputs/certificate.input';
import { AdminOnly, Authenticate, Authorized } from '@/middlewares/auth.middleware';
import { RATE_LIMITS, RateLimit } from '@/middlewares/rate-limit.middleware';
import { CertificateService } from '@/services/certificate.service';
import { CertificateTemplateService } from '@/services/certificate-template.service';

@Controller('/certificates')
export class CertificateController {
  @Inject()
  private certificateService!: CertificateService;

  @Inject()
  private certificateTemplateService!: CertificateTemplateService;

  @Get('/template')
  async getTemplate() {
    return { success: true, data: await this.certificateTemplateService.get() };
  }

  @Put('/template')
  @Authorized(AdminOnly())
  @RateLimit(RATE_LIMITS.admin)
  async updateTemplate(@BodyParams() body: UpdateCertificateTemplateInput) {
    const data = UpdateCertificateTemplateInputSchema.parse(body);
    return { success: true, data: await this.certificateTemplateService.update(data) };
  }

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
