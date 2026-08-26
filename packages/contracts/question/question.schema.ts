import type { LocalizedText } from '../common/localized-text';

// types

export type QuestionDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

// interfaces

export interface QuestionOutput {
  id: string;
  examId: string;
  text: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  difficulty: QuestionDifficulty;
  imageKey: string | null;
  order: number;
}
