import { randomInt } from 'node:crypto';
import type { QuestionDifficulty } from '@repo/contracts';

const LEVELS: QuestionDifficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

/** How many recent results AUTO looks at. */
export const AUTO_HISTORY_SIZE = 5;

// types

interface PoolQuestion {
  id: string;
  difficulty: QuestionDifficulty;
}

type RandomInt = (maxExclusive: number) => number;

/** Target levels for AUTO from the average of recent scores (0–100); no history starts gently. */
export const autoLevelsFor = (recentScores: number[]): QuestionDifficulty[] => {
  if (!recentScores.length) return ['BEGINNER', 'INTERMEDIATE'];

  const average = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

  if (average < 50) return ['BEGINNER', 'INTERMEDIATE'];
  if (average < 70) return ['INTERMEDIATE'];
  if (average < 85) return ['INTERMEDIATE', 'ADVANCED'];
  return ['ADVANCED', 'EXPERT'];
};

export const shuffle = <T>(items: readonly T[], random: RandomInt = randomInt): T[] => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index--) {
    const swap = random(index + 1);
    [result[index], result[swap]] = [result[swap] as T, result[index] as T];
  }

  return result;
};

/**
 * Picks up to `count` question ids. With `targetLevels`, questions at those levels come first and the
 * shortfall is filled from the nearest levels, so a thin topic still yields a full set.
 */
export const pickQuestionIds = (
  pool: readonly PoolQuestion[],
  count: number,
  targetLevels: QuestionDifficulty[] | null,
  random: RandomInt = randomInt,
): string[] => {
  const shuffled = shuffle(pool, random);
  if (!targetLevels?.length) return shuffled.slice(0, count).map((question) => question.id);

  const targetIndexes = targetLevels.map((level) => LEVELS.indexOf(level));
  const distance = (question: PoolQuestion) => {
    const index = LEVELS.indexOf(question.difficulty);
    return Math.min(...targetIndexes.map((target) => Math.abs(index - target)));
  };

  // Array.prototype.sort is stable, so equal distances keep the shuffled order
  const chosen = shuffled.sort((a, b) => distance(a) - distance(b)).slice(0, count);

  return shuffle(chosen, random).map((question) => question.id);
};
