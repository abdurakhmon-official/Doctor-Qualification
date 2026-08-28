import { gradeAttempt, gradeToLevel } from './scoring.utils';
import { QUALIFICATION_LEVEL } from '../generated/prisma';

describe('gradeAttempt', () => {
  const questions = [
    { id: 'q1', correctIndex: 0 },
    { id: 'q2', correctIndex: 1 },
    { id: 'q3', correctIndex: 2 },
    { id: 'q4', correctIndex: 3 },
  ];

  it('scores 100% when every answer is correct', () => {
    const result = gradeAttempt(questions, { q1: 0, q2: 1, q3: 2, q4: 3 });
    expect(result).toEqual({ score: 100, correctCount: 4, questionCount: 4 });
  });

  it('scores 0% when every answer is wrong', () => {
    const result = gradeAttempt(questions, { q1: 3, q2: 0, q3: 0, q4: 0 });
    expect(result).toEqual({ score: 0, correctCount: 0, questionCount: 4 });
  });

  it('ignores missing answers as incorrect (does not throw)', () => {
    const result = gradeAttempt(questions, { q1: 0, q2: 1 });
    expect(result).toEqual({ score: 50, correctCount: 2, questionCount: 4 });
  });

  it('ignores answers for question ids not in the exam', () => {
    const result = gradeAttempt(questions, { q1: 0, q2: 1, unknown: 5 });
    expect(result.correctCount).toBe(2);
  });

  it('rounds the percentage to the nearest whole number', () => {
    const threeQuestions = questions.slice(0, 3);
    const result = gradeAttempt(threeQuestions, { q1: 0, q2: 1 });
    expect(result.score).toBe(67); // 2/3 = 66.66... -> rounds to 67
  });

  it('does not divide by zero for an exam with no questions', () => {
    const result = gradeAttempt([], {});
    expect(result).toEqual({ score: 0, correctCount: 0, questionCount: 0 });
  });
});

describe('gradeToLevel', () => {
  it.each([
    [0, QUALIFICATION_LEVEL.BEGINNER],
    [49, QUALIFICATION_LEVEL.BEGINNER],
    [50, QUALIFICATION_LEVEL.INTERMEDIATE],
    [69, QUALIFICATION_LEVEL.INTERMEDIATE],
    [70, QUALIFICATION_LEVEL.GOOD],
    [84, QUALIFICATION_LEVEL.GOOD],
    [85, QUALIFICATION_LEVEL.HIGH],
    [94, QUALIFICATION_LEVEL.HIGH],
    [95, QUALIFICATION_LEVEL.EXPERT],
    [100, QUALIFICATION_LEVEL.EXPERT],
  ])('maps a score of %i to %s (spec §4 bands)', (score, expected) => {
    expect(gradeToLevel(score)).toBe(expected);
  });
});
