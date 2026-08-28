import { computeUserRating } from './rating.utils';

const DEFAULT_WEIGHTS = {
  avgScoreWeight: 0.4,
  bestScoreWeight: 0.2,
  consistencyWeight: 0.2,
  attemptCountWeight: 0.2,
};

describe('computeUserRating', () => {
  it('matches the hand-computed composite for a single attempt (default weights)', () => {
    // avg=100, best=100, consistency=100 (single score has no variance), attemptCountScore=10 (1/10*100)
    // weighted: 100*0.4 + 100*0.2 + 100*0.2 + 10*0.2 = 82
    const result = computeUserRating({ scores: [100] }, DEFAULT_WEIGHTS);
    expect(result).toEqual({ avgScore: 100, bestScore: 100, attemptCount: 1, compositeScore: 82 });
  });

  it('penalizes inconsistency via standard deviation', () => {
    // avg=90, best=100, variance=((80-90)^2+(100-90)^2)/2=100, stddev=10, consistency=90, attemptCountScore=20
    // weighted: 90*0.4 + 100*0.2 + 90*0.2 + 20*0.2 = 78
    const result = computeUserRating({ scores: [80, 100] }, DEFAULT_WEIGHTS);
    expect(result).toEqual({ avgScore: 90, bestScore: 100, attemptCount: 2, compositeScore: 78 });
  });

  it('caps the attempt-count score at 100 beyond the target of 10 attempts', () => {
    const fifteenPerfectScores = Array(15).fill(100);
    const result = computeUserRating({ scores: fifteenPerfectScores }, DEFAULT_WEIGHTS);
    expect(result.compositeScore).toBe(100);
    expect(result.attemptCount).toBe(15);
  });

  it('returns compositeScore 0 rather than dividing by zero when all weights are 0', () => {
    const zeroWeights = { avgScoreWeight: 0, bestScoreWeight: 0, consistencyWeight: 0, attemptCountWeight: 0 };
    const result = computeUserRating({ scores: [50, 75] }, zeroWeights);
    expect(result.compositeScore).toBe(0);
    expect(result.avgScore).toBe(62.5);
  });

  it('rounds avgScore and compositeScore to one decimal place', () => {
    const result = computeUserRating({ scores: [70, 71, 71] }, DEFAULT_WEIGHTS);
    expect(result.avgScore).toBe(70.7);
  });
});
