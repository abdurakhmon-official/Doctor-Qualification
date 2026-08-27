// types

interface UserScores {
  scores: number[];
}

interface RatingWeights {
  avgScoreWeight: number;
  bestScoreWeight: number;
  consistencyWeight: number;
  attemptCountWeight: number;
}

interface ComputedRating {
  avgScore: number;
  bestScore: number;
  attemptCount: number;
  compositeScore: number;
}

const ATTEMPT_COUNT_TARGET = 10;

const average = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

const standardDeviation = (values: number[], mean: number): number => {
  if (values.length <= 1) return 0;

  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const computeUserRating = (user: UserScores, weights: RatingWeights): ComputedRating => {
  const avgScore = average(user.scores);
  const bestScore = Math.max(...user.scores);
  const consistencyScore = Math.max(0, 100 - standardDeviation(user.scores, avgScore));
  const attemptCountScore = Math.min(100, (user.scores.length / ATTEMPT_COUNT_TARGET) * 100);

  const totalWeight = weights.avgScoreWeight + weights.bestScoreWeight + weights.consistencyWeight + weights.attemptCountWeight;

  const weightedSum =
    avgScore * weights.avgScoreWeight +
    bestScore * weights.bestScoreWeight +
    consistencyScore * weights.consistencyWeight +
    attemptCountScore * weights.attemptCountWeight;

  const compositeScore = totalWeight === 0 ? 0 : weightedSum / totalWeight;

  return {
    avgScore: Math.round(avgScore * 10) / 10,
    bestScore,
    attemptCount: user.scores.length,
    compositeScore: Math.round(compositeScore * 10) / 10,
  };
};
