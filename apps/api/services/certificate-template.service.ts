import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import type { CertificateTemplateOutput, UpdateCertificateTemplateInput } from '@repo/contracts';
import prisma from '@/modules/db';
import { redis, isRedisReady } from '@/modules/redis';
import { AuditService } from '@/services/audit.service';
import { Prisma } from '../generated/prisma';

@Injectable()
export class CertificateTemplateService {
  // v2: output gained isAccredited/accreditationText — older cached payloads lack them
  private static readonly CACHE_KEY = 'certificate-template:v2';
  private static readonly DEFAULTS = {
    brand: { uz: 'Doctor Qualification', ru: 'Doctor Qualification', en: 'Doctor Qualification' },
    title: { uz: 'SERTIFIKAT', ru: 'СЕРТИФИКАТ', en: 'CERTIFICATE' },
    subtitle: {
      uz: "Shifokorlar bilim va malakasini baholash platformasi",
      ru: 'Платформа оценки знаний и квалификации врачей',
      en: 'Doctor qualification assessment platform',
    },
    bodyText: {
      uz: "Ushbu sertifikat quyidagi shaxsning mutaxassislik bo'yicha malaka imtihonidan muvaffaqiyatli o'tganligini tasdiqlaydi:",
      ru: 'Настоящий сертификат подтверждает, что указанное лицо успешно прошло квалификационный экзамен по специальности:',
      en: 'This certificate confirms that the person named below has successfully passed a qualification exam in:',
    },
  };

  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private auditService!: AuditService;

  private get actor() {
    const user = this.context.getRequest<Request>().user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  async get(): Promise<CertificateTemplateOutput> {
    const cached = await this.readCache();
    if (cached) return cached;

    const template = await this.getOrCreateRow();
    const output = this.toOutput(template);
    await this.writeCache(output);

    return output;
  }

  async update(input: UpdateCertificateTemplateInput): Promise<CertificateTemplateOutput> {
    const row = await this.getOrCreateRow();

    const updated = await prisma.certificateTemplate.update({
      where: { id: row.id },
      data: { ...input, accreditationText: input.accreditationText ?? Prisma.DbNull },
    });

    const output = this.toOutput(updated);
    await this.writeCache(output);

    await this.auditService.log({
      ...this.actor,
      action: 'CERTIFICATE_TEMPLATE_UPDATED',
      entityType: 'CertificateTemplate',
      entityId: row.id,
      before: this.toOutput(row),
      after: output,
    });

    return output;
  }

  private async getOrCreateRow() {
    const existing = await prisma.certificateTemplate.findFirst();
    if (existing) return existing;

    return prisma.certificateTemplate.create({ data: CertificateTemplateService.DEFAULTS });
  }

  private toOutput(template: {
    brand: unknown;
    title: unknown;
    subtitle: unknown;
    bodyText: unknown;
    isAccredited: boolean;
    accreditationText: unknown;
  }): CertificateTemplateOutput {
    return {
      brand: template.brand as CertificateTemplateOutput['brand'],
      title: template.title as CertificateTemplateOutput['title'],
      subtitle: template.subtitle as CertificateTemplateOutput['subtitle'],
      bodyText: template.bodyText as CertificateTemplateOutput['bodyText'],
      isAccredited: template.isAccredited,
      accreditationText: (template.accreditationText ?? null) as CertificateTemplateOutput['accreditationText'],
    };
  }

  private async readCache(): Promise<CertificateTemplateOutput | null> {
    if (!isRedisReady()) return null;

    try {
      const raw = await redis.get(CertificateTemplateService.CACHE_KEY);
      return raw ? (JSON.parse(raw) as CertificateTemplateOutput) : null;
    } catch {
      return null;
    }
  }

  private async writeCache(template: CertificateTemplateOutput): Promise<void> {
    if (!isRedisReady()) return;

    try {
      await redis.set(CertificateTemplateService.CACHE_KEY, JSON.stringify(template));
    } catch {
    }
  }
}
