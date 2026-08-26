import type { LocalizedText } from '../common/localized-text';
import type { QualificationLevel } from '../exam-attempt/exam-attempt.schema';

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
}
