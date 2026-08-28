import { QUALIFICATION_LEVEL } from '../generated/prisma';

// types

interface GradableQuestion {
  id: string;
  correctIndex: number;
}

interface GradeResult {
  score: number;
  correctCount: number;
  questionCount: number;
}

export const gradeAttempt = (questions: GradableQuestion[], answers: Record<string, number>): GradeResult => {
  const correctCount = questions.reduce((count, question) => {
    return answers[question.id] === question.correctIndex ? count + 1 : count;
  }, 0);

  const questionCount = questions.length;
  const score = questionCount === 0 ? 0 : Math.round((correctCount / questionCount) * 100);

  return { score, correctCount, questionCount };
};

export const gradeToLevel = (score: number): QUALIFICATION_LEVEL => {
  if (score >= 95) return QUALIFICATION_LEVEL.EXPERT;
  if (score >= 85) return QUALIFICATION_LEVEL.HIGH;
  if (score >= 70) return QUALIFICATION_LEVEL.GOOD;
  if (score >= 50) return QUALIFICATION_LEVEL.INTERMEDIATE;
  return QUALIFICATION_LEVEL.BEGINNER;
};
