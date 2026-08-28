import { z } from 'zod';
import { LocalizedTextSchema, type LocalizedText } from '../common/localized-text';
import type { QualificationLevel } from '../exam-attempt/exam-attempt.schema';

// schemas

export const AdminCertificateQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(50).default(20),
});

/** Sertifikatning marosim matni — ko'rinish/joylashuv kodda qoladi, faqat shu matn admin ixtiyorida (rule: dynamic standards.md). */
export const UpdateCertificateTemplateInputSchema = z.object({
  brand: LocalizedTextSchema,
  title: LocalizedTextSchema,
  subtitle: LocalizedTextSchema,
  bodyText: LocalizedTextSchema,
});

// types

export type AdminCertificateQuery = z.infer<typeof AdminCertificateQuerySchema>;
export type UpdateCertificateTemplateInput = z.infer<typeof UpdateCertificateTemplateInputSchema>;

// interfaces

export interface CertificateOutput {
  certificateId: string;
  userFullName: string;
  specialtyName: LocalizedText;
  score: number;
  level: QualificationLevel;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
  expired: boolean;
}

export interface MyCertificateListItem {
  certificateId: string;
  specialtyName: LocalizedText;
  score: number;
  level: QualificationLevel;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
}

export interface AdminCertificateListItem {
  certificateId: string;
  userFullName: string;
  specialtyName: LocalizedText;
  score: number;
  level: QualificationLevel;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
}

export interface CertificateTemplateOutput {
  brand: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  bodyText: LocalizedText;
}
