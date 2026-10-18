import type { QuestionDifficulty } from '@repo/contracts';
import { autoLevelsFor, pickQuestionIds, shuffle } from './practice.utils';

const pool = (counts: Partial<Record<QuestionDifficulty, number>>) =>
  Object.entries(counts).flatMap(([difficulty, count]) =>
    Array.from({ length: count }, (_, index) => ({ id: `${difficulty}-${index}`, difficulty: difficulty as QuestionDifficulty })),
  );

const levelOf = (id: string) => id.split('-')[0];

describe('autoLevelsFor', () => {
  it('starts gently without history', () => {
    expect(autoLevelsFor([])).toEqual(['BEGINNER', 'INTERMEDIATE']);
  });

  it.each([
    [[30, 40], ['BEGINNER', 'INTERMEDIATE']],
    [[50, 69], ['INTERMEDIATE']],
    [[70, 84], ['INTERMEDIATE', 'ADVANCED']],
    [[85, 100], ['ADVANCED', 'EXPERT']],
  ])('averages %j into %j', (scores, levels) => {
    expect(autoLevelsFor(scores)).toEqual(levels);
  });
});

describe('shuffle', () => {
  it('keeps every item exactly once and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input);

    expect([...output].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('pickQuestionIds', () => {
  it('returns at most `count` unique ids', () => {
    const ids = pickQuestionIds(pool({ BEGINNER: 30 }), 10, null);

    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
  });

  it('returns the whole pool when it is smaller than `count`', () => {
    expect(pickQuestionIds(pool({ BEGINNER: 3 }), 10, null)).toHaveLength(3);
  });

  it('takes only target levels when there are enough of them', () => {
    const ids = pickQuestionIds(pool({ BEGINNER: 20, ADVANCED: 20, EXPERT: 20 }), 15, ['ADVANCED', 'EXPERT']);

    expect(ids.every((id) => ['ADVANCED', 'EXPERT'].includes(levelOf(id)!))).toBe(true);
  });

  it('fills a shortfall from the nearest level before farther ones', () => {
    const ids = pickQuestionIds(pool({ BEGINNER: 10, INTERMEDIATE: 10, EXPERT: 2 }), 6, ['EXPERT']);
    const levels = ids.map(levelOf);

    expect(levels.filter((level) => level === 'EXPERT')).toHaveLength(2);
    // ADVANCED is empty, so INTERMEDIATE (distance 2) fills before BEGINNER (distance 3)
    expect(levels.filter((level) => level === 'INTERMEDIATE')).toHaveLength(4);
    expect(levels).not.toContain('BEGINNER');
  });

  it('varies between runs', () => {
    const questions = pool({ INTERMEDIATE: 50 });
    const runs = new Set(Array.from({ length: 5 }, () => pickQuestionIds(questions, 10, null).join()));

    expect(runs.size).toBeGreaterThan(1);
  });

  it('handles an empty pool', () => {
    expect(pickQuestionIds([], 10, ['BEGINNER'])).toEqual([]);
  });
});
