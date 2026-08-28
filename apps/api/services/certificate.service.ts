import { Inject, Injectable, InjectContext } from '@tsed/di';
import { PlatformContext } from '@tsed/common';
import type { Request } from 'express';
import { addYears } from 'date-fns';
import { AdminCertificateQuerySchema } from '@repo/contracts';
import prisma from '@/modules/db';
import { generateCertificateId } from '@/utils/certificate.utils';
import { requireUserId } from '@/utils/errors.utils';
import { CertificateNotFoundException } from '@/exceptions/certificate.exceptions';
import { AuditService } from '@/services/audit.service';
import type { LocalizedText } from '@repo/contracts';
import { QUALIFICATION_LEVEL, type Prisma } from '../generated/prisma';

interface IssueInput {
  attemptId: string;
  userId: string;
  examId: string;
  userFullName: string;
  specialtyName: LocalizedText;
  score: number;
  level: QUALIFICATION_LEVEL;
}

@Injectable()
export class CertificateService {
  @InjectContext()
  private context!: PlatformContext;

  @Inject()
  private auditService!: AuditService;

  private get userId(): string {
    return requireUserId(this.context.getRequest<Request>().user);
  }

  private get actor() {
    const user = this.context.getRequest<Request>().user!;
    return { actorId: user.id, actorEmail: user.email };
  }

  /**
   * attemptId'ga unique constraint borligi sababli idempotent — takror chaqirilsa ham faqat bitta sertifikat yaratiladi.
   * `client` — ExamAttemptService.submitAttempt shu metodni attempt yozuvini yangilash bilan bitta `$transaction` ichida chaqiradi;
   * standalone chaqiruv uchun default — oddiy `prisma` singleton.
   */
  async checkAndIssue(input: IssueInput, client: Prisma.TransactionClient = prisma): Promise<boolean> {
    const existing = await client.certificate.findUnique({ where: { attemptId: input.attemptId }, select: { id: true } });
    if (existing) return true;

    try {
      await client.certificate.create({
        data: {
          certificateId: generateCertificateId(),
          attemptId: input.attemptId,
          userId: input.userId,
          examId: input.examId,
          userFullName: input.userFullName,
          specialtyName: input.specialtyName,
          score: input.score,
          level: input.level,
          expiresAt: addYears(new Date(), 1),
        },
      });

      return true;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') return true;
      throw error;
    }
  }

  async myCertificates() {
    const certificates = await prisma.certificate.findMany({
      where: { userId: this.userId },
      select: { certificateId: true, specialtyName: true, score: true, level: true, issuedAt: true, expiresAt: true, revoked: true },
      orderBy: { issuedAt: 'desc' },
    });

    return {
      success: true,
      data: certificates.map((certificate) => ({
        ...certificate,
        issuedAt: certificate.issuedAt.toISOString(),
        expiresAt: certificate.expiresAt.toISOString(),
      })),
    };
  }

  /** Ochiq (autentifikatsiyasiz) — Certificate ID yoki QR orqali har kim tekshira oladi. */
  async verify(certificateId: string) {
    const certificate = await prisma.certificate.findUnique({ where: { certificateId } });
    if (!certificate) throw new CertificateNotFoundException(certificateId);

    return {
      success: true,
      data: {
        certificateId: certificate.certificateId,
        userFullName: certificate.userFullName,
        specialtyName: certificate.specialtyName,
        score: certificate.score,
        level: certificate.level,
        issuedAt: certificate.issuedAt.toISOString(),
        expiresAt: certificate.expiresAt.toISOString(),
        revoked: certificate.revoked,
        expired: certificate.expiresAt < new Date(),
      },
    };
  }

  async adminList(rawQuery: unknown) {
    const { page, size } = AdminCertificateQuerySchema.parse(rawQuery);

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        select: { certificateId: true, userFullName: true, specialtyName: true, score: true, level: true, issuedAt: true, expiresAt: true, revoked: true },
        skip: (page - 1) * size,
        take: size,
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.certificate.count(),
    ]);

    return {
      success: true,
      data: certificates.map((certificate) => ({
        ...certificate,
        issuedAt: certificate.issuedAt.toISOString(),
        expiresAt: certificate.expiresAt.toISOString(),
      })),
      meta: { page, limit: size, total },
    };
  }

  async revoke(certificateId: string) {
    const certificate = await prisma.certificate.findUnique({ where: { certificateId }, select: { id: true, revoked: true } });
    if (!certificate) throw new CertificateNotFoundException(certificateId);

    await prisma.certificate.update({ where: { certificateId }, data: { revoked: true, revokedAt: new Date() } });

    await this.auditService.log({
      ...this.actor,
      action: 'CERTIFICATE_REVOKED',
      entityType: 'Certificate',
      entityId: certificate.id,
      before: { revoked: certificate.revoked },
      after: { revoked: true },
    });

    return { success: true, data: null };
  }
}
