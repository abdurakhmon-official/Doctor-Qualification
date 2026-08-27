import { z } from 'zod';
import type { LocalizedText } from '../common/localized-text';
import type { QualificationLevel } from '../exam-attempt/exam-attempt.schema';

// schemas

export const AdminCertificateQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(50).default(20),
});

// types

export type AdminCertificateQuery = z.infer<typeof AdminCertificateQuerySchema>;

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
