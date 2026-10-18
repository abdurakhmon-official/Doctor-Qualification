import { z } from 'zod';
import { LocaleSchema, type Locale } from '../common/locale';

// schemas

export const AnalysisKindSchema = z.enum(['EXAM', 'PRACTICE', 'COMPETITION']);

/** The UI language is sent explicitly: the profile language and the page language can differ. */
export const AnalysisLocaleInputSchema = z.object({
  locale: LocaleSchema,
});

// types

export type AnalysisKind = z.infer<typeof AnalysisKindSchema>;
export type AnalysisLocaleInput = z.infer<typeof AnalysisLocaleInputSchema>;

// interfaces

export interface AnalysisMistake {
  /** 1-based number as shown on the result screen. */
  questionNumber: number;
  keyConcept: string;
  explanation: string;
}

export interface AnalysisStudyItem {
  /** Set when the advice maps to one of the specialty's topics, so the UI can offer practice on it. */
  topicId: string | null;
  topic: string;
  reason: string;
  tips: string[];
}

export interface AttemptAnalysisOutput {
  kind: AnalysisKind;
  attemptId: string;
  locale: Locale;
  createdAt: string;
  summary: string;
  mistakes: AnalysisMistake[];
  studyPlan: AnalysisStudyItem[];
  encouragement: string;
  /** Whether the feedback was allowed to name correct options (platform setting). */
  revealsCorrectAnswers: boolean;
}

export interface AiStatusOutput {
  enabled: boolean;
  dailyLimit: number;
  usedToday: number;
}
