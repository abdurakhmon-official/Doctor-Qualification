// types

export type QualificationLevel = 'BEGINNER' | 'INTERMEDIATE' | 'GOOD' | 'HIGH' | 'EXPERT';

// interfaces

export interface ExamAttemptOutput {
  id: string;
  examId: string;
  userId: string;
  questionCount: number;
  score: number | null;
  correctCount: number | null;
  level: QualificationLevel | null;
  timeSpentSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
}
