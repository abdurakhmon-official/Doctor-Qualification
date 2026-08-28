import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import type { CertificateTemplateOutput, UpdateCertificateTemplateInput } from '@repo/contracts';
import prisma from '@/modules/db';
import { redis, isRedisReady } from '@/modules/redis';
import { AuditService } from '@/services/audit.service';

/**
 * Sertifikatning marosim matni — singleton, admin-editable (rule: dynamic standards.md,
 * o'z misolidagi "Sertifikat: Shablon matni... admin ma'lumotida" qatoriga mos). Ko'rinish/
 * joylashuv (border, QR, meta blocklar) CertificateDocument.tsx'da kodda qoladi — faqat matn
 * o'zi shu yerda. RatingSettingsService bilan bir xil naqsh: Redis'da keshlanadi, admin
 * o'zgartirganda kesh invalidatsiya qilinadi.
 */
@Injectable()
export class CertificateTemplateService {
  private static readonly CACHE_KEY = 'certificate-template';
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

  /** Ochiq — sertifikat ko'rish sahifasi (o'zining ham, ochiq QR-tekshiruv ham) shu orqali render qiladi. */
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
      data: input,
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
  }): CertificateTemplateOutput {
    return {
      brand: template.brand as CertificateTemplateOutput['brand'],
      title: template.title as CertificateTemplateOutput['title'],
      subtitle: template.subtitle as CertificateTemplateOutput['subtitle'],
      bodyText: template.bodyText as CertificateTemplateOutput['bodyText'],
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
      // Redis o'chirilgan bo'lishi mumkin — muvaffaqiyatsizlik jim o'tkaziladi, DB manba bo'lib qoladi.
    }
  }
}
