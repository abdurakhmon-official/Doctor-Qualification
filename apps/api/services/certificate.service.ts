import { Injectable } from '@tsed/di';
import { addYears } from 'date-fns';
import prisma from '@/modules/db';
import { generateCertificateId } from '@/utils/certificate.utils';
import type { LocalizedText } from '@repo/contracts';
import { QUALIFICATION_LEVEL } from '../generated/prisma';

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
  /** attemptId'ga unique constraint borligi sababli idempotent — takror chaqirilsa ham faqat bitta sertifikat yaratiladi. */
  async checkAndIssue(input: IssueInput): Promise<boolean> {
    const existing = await prisma.certificate.findUnique({ where: { attemptId: input.attemptId }, select: { id: true } });
    if (existing) return true;

    try {
      await prisma.certificate.create({
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
}
