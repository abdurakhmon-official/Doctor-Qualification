import type { CompetitionStatus } from '@repo/contracts';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Weekly contests follow Tashkent time (UTC+5, no DST): Monday 00:00 to the next Monday 00:00. */
export const COMPETITION_UTC_OFFSET_MINUTES = 5 * 60;

// types

interface Window {
  startsAt: Date;
  endsAt: Date;
}

interface RankableEntry {
  score: number;
  timeSpentSeconds: number;
  submittedAt: Date;
}

/** ISO-8601 week key ("2026-W43") of a calendar date given as UTC y/m/d parts. */
export const isoWeekKey = (year: number, month: number, day: number): string => {
  const date = new Date(Date.UTC(year, month, day));
  const weekday = date.getUTCDay() || 7; // Mon=1 … Sun=7
  // the ISO week belongs to the year of its Thursday
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const isoYear = date.getUTCFullYear();
  const week = Math.ceil(((date.getTime() - Date.UTC(isoYear, 0, 1)) / DAY_MS + 1) / 7);

  return `${isoYear}-W${String(week).padStart(2, '0')}`;
};

/** The weekly window containing `now`; endsAt is exclusive. */
export const weekWindow = (now: Date, offsetMinutes: number = COMPETITION_UTC_OFFSET_MINUTES): Window & { weekKey: string } => {
  const local = new Date(now.getTime() + offsetMinutes * 60_000);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  const mondayUtcMidnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysSinceMonday);
  const startsAt = new Date(mondayUtcMidnight - offsetMinutes * 60_000);
  const monday = new Date(mondayUtcMidnight);

  return {
    weekKey: isoWeekKey(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()),
    startsAt,
    endsAt: new Date(startsAt.getTime() + 7 * DAY_MS),
  };
};

export const competitionStatus = ({ startsAt, endsAt }: Window, now: Date = new Date()): CompetitionStatus => {
  if (now < startsAt) return 'UPCOMING';
  if (now >= endsAt) return 'FINISHED';
  return 'ACTIVE';
};

/** An entry runs for its time limit but never past the end of the competition. */
export const entryDeadline = (startedAt: Date, durationMinutes: number, endsAt: Date): Date =>
  new Date(Math.min(startedAt.getTime() + durationMinutes * 60_000, endsAt.getTime()));

/** Higher score first, then less time, then whoever submitted earlier. */
export const compareEntries = (a: RankableEntry, b: RankableEntry): number =>
  b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds || a.submittedAt.getTime() - b.submittedAt.getTime();

/**
 * Standard competition ranking ("1, 1, 3"): equal score and equal time share a place.
 * Submission order only breaks display order, not the rank.
 */
export const rankEntries = <T extends RankableEntry>(entries: T[]): (T & { rank: number })[] => {
  const sorted = [...entries].sort(compareEntries);
  let rank = 0;

  return sorted.map((entry, index) => {
    const previous = sorted[index - 1];
    // sorted order puts full ties next to each other, so one pass is enough
    if (!previous || previous.score !== entry.score || previous.timeSpentSeconds !== entry.timeSpentSeconds) rank = index + 1;
    return { ...entry, rank };
  });
};
