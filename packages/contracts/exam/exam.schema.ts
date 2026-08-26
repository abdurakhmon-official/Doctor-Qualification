import type { LocalizedText } from '../common/localized-text';

// types

export type ExamStatus = 'DRAFT' | 'PUBLISHED';

// interfaces

export interface ExamOutput {
  id: string;
  specialtyId: string;
  title: LocalizedText;
  description: LocalizedText | null;
  durationMinutes: number;
  minCertificateScore: number;
  status: ExamStatus;
  questionCount?: number;
}
