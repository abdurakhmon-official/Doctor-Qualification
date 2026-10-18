import { competitionStatus, entryDeadline, isoWeekKey, rankEntries, weekWindow } from './competition.utils';

describe('isoWeekKey', () => {
  it.each([
    [2026, 9, 19, '2026-W43'], // Mon 19 Oct 2026
    [2026, 0, 1, '2026-W01'], // Thu 1 Jan 2026
    [2027, 0, 1, '2026-W53'], // Fri 1 Jan 2027 belongs to 2026's last week
    [2024, 11, 30, '2025-W01'], // Mon 30 Dec 2024 belongs to 2025
  ])('%i-%i-%i -> %s', (year, month, day, key) => {
    expect(isoWeekKey(year, month, day)).toBe(key);
  });
});

describe('weekWindow (Tashkent, UTC+5)', () => {
  it('spans Monday 00:00 to next Monday 00:00 local time', () => {
    const window = weekWindow(new Date('2026-10-21T12:00:00Z')); // Wednesday
    expect(window.weekKey).toBe('2026-W43');
    expect(window.startsAt.toISOString()).toBe('2026-10-18T19:00:00.000Z'); // Mon 19 Oct 00:00 +05
    expect(window.endsAt.toISOString()).toBe('2026-10-25T19:00:00.000Z');
  });

  it('treats Sunday late evening UTC as already the next week in Tashkent', () => {
    // Sun 25 Oct 20:00 UTC = Mon 26 Oct 01:00 in Tashkent
    expect(weekWindow(new Date('2026-10-25T20:00:00Z')).weekKey).toBe('2026-W44');
    // one hour earlier it is still Sunday in Tashkent
    expect(weekWindow(new Date('2026-10-25T18:30:00Z')).weekKey).toBe('2026-W43');
  });

  it('keeps the start inside the window', () => {
    const { startsAt, endsAt } = weekWindow(new Date('2026-10-18T19:00:00Z'));
    expect(competitionStatus({ startsAt, endsAt }, new Date('2026-10-18T19:00:00Z'))).toBe('ACTIVE');
  });
});

describe('competitionStatus', () => {
  const window = { startsAt: new Date('2026-10-19T00:00:00Z'), endsAt: new Date('2026-10-26T00:00:00Z') };

  it('is UPCOMING before, ACTIVE during and FINISHED at/after the end', () => {
    expect(competitionStatus(window, new Date('2026-10-18T23:59:59Z'))).toBe('UPCOMING');
    expect(competitionStatus(window, new Date('2026-10-20T00:00:00Z'))).toBe('ACTIVE');
    expect(competitionStatus(window, new Date('2026-10-26T00:00:00Z'))).toBe('FINISHED');
  });
});

describe('entryDeadline', () => {
  it('is capped by the end of the competition', () => {
    const endsAt = new Date('2026-10-26T00:00:00Z');
    expect(entryDeadline(new Date('2026-10-20T10:00:00Z'), 20, endsAt).toISOString()).toBe('2026-10-20T10:20:00.000Z');
    expect(entryDeadline(new Date('2026-10-25T23:50:00Z'), 20, endsAt).toISOString()).toBe(endsAt.toISOString());
  });
});

describe('rankEntries', () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 9, 20, 10, minute));

  it('orders by score, then time, and shares places on full ties', () => {
    const ranked = rankEntries([
      { id: 'slow', score: 90, timeSpentSeconds: 500, submittedAt: at(1) },
      { id: 'fast', score: 90, timeSpentSeconds: 300, submittedAt: at(5) },
      { id: 'tieA', score: 80, timeSpentSeconds: 200, submittedAt: at(2) },
      { id: 'tieB', score: 80, timeSpentSeconds: 200, submittedAt: at(1) },
      { id: 'last', score: 10, timeSpentSeconds: 50, submittedAt: at(0) },
    ]);

    expect(ranked.map((entry) => [entry.id, entry.rank])).toEqual([
      ['fast', 1],
      ['slow', 2],
      ['tieB', 3],
      ['tieA', 3],
      ['last', 5],
    ]);
  });

  it('handles an empty list', () => {
    expect(rankEntries([])).toEqual([]);
  });
});
