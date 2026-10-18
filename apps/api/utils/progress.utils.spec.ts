import { activityStreak, dayKey, tallyTopics, type GradableAnswerQuestion } from './progress.utils';

const TASHKENT = -300; // UTC+5, as Date#getTimezoneOffset() reports it

describe('dayKey', () => {
  it('uses the viewer zone, not UTC', () => {
    // 20:30 UTC on Oct 17 is already 01:30 on Oct 18 in Tashkent
    expect(dayKey(new Date('2026-10-17T20:30:00Z'), TASHKENT)).toBe('2026-10-18');
    expect(dayKey(new Date('2026-10-17T20:30:00Z'), 0)).toBe('2026-10-17');
  });
});

describe('activityStreak', () => {
  const now = new Date('2026-10-18T10:00:00Z'); // 15:00 in Tashkent

  it('is zero without activity', () => {
    expect(activityStreak([], TASHKENT, now)).toEqual({ streakDays: 0, activeToday: false });
  });

  it('counts consecutive days ending today', () => {
    const dates = ['2026-10-18T05:00:00Z', '2026-10-17T05:00:00Z', '2026-10-16T05:00:00Z', '2026-10-14T05:00:00Z'].map((iso) => new Date(iso));
    expect(activityStreak(dates, TASHKENT, now)).toEqual({ streakDays: 3, activeToday: true });
  });

  it('keeps a streak that ended yesterday alive', () => {
    const dates = ['2026-10-17T05:00:00Z', '2026-10-16T05:00:00Z'].map((iso) => new Date(iso));
    expect(activityStreak(dates, TASHKENT, now)).toEqual({ streakDays: 2, activeToday: false });
  });

  it('breaks after a missed day', () => {
    expect(activityStreak([new Date('2026-10-16T05:00:00Z')], TASHKENT, now)).toEqual({ streakDays: 0, activeToday: false });
  });

  it('counts several attempts on one day once', () => {
    const dates = ['2026-10-18T04:00:00Z', '2026-10-18T06:00:00Z', '2026-10-18T08:00:00Z'].map((iso) => new Date(iso));
    expect(activityStreak(dates, TASHKENT, now).streakDays).toBe(1);
  });

  it('applies the zone at the day boundary', () => {
    // 19:30 UTC Oct 17 = 00:30 Oct 18 in Tashkent -> "today" there, "yesterday" in UTC
    const late = [new Date('2026-10-17T19:30:00Z')];
    expect(activityStreak(late, TASHKENT, now)).toEqual({ streakDays: 1, activeToday: true });
    expect(activityStreak(late, 0, now)).toEqual({ streakDays: 1, activeToday: false });
  });
});

describe('tallyTopics', () => {
  const questions = new Map<string, GradableAnswerQuestion>([
    ['q1', { correctIndex: 0, topicId: 't1', specialtyId: 's1' }],
    ['q2', { correctIndex: 1, topicId: 't1', specialtyId: 's1' }],
    ['q3', { correctIndex: 2, topicId: null, specialtyId: 's1' }],
    ['q4', { correctIndex: 3, topicId: null, specialtyId: 's2' }],
  ]);

  it('groups by specialty and topic, untagged per specialty', () => {
    const result = tallyTopics([{ q1: 0, q2: 0, q3: 2 }, { q1: 0, q4: 3 }], questions);

    expect(result.answered).toBe(5);
    expect(result.correct).toBe(4);
    expect(result.tallies).toEqual(
      expect.arrayContaining([
        { topicId: 't1', specialtyId: 's1', correct: 2, answered: 3 },
        { topicId: null, specialtyId: 's1', correct: 1, answered: 1 },
        { topicId: null, specialtyId: 's2', correct: 1, answered: 1 },
      ]),
    );
    expect(result.tallies).toHaveLength(3);
  });

  it('ignores answers to deleted questions', () => {
    expect(tallyTopics([{ gone: 1 }], questions)).toEqual({ tallies: [], correct: 0, answered: 0 });
  });
});
