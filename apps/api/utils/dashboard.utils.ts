import { format, subDays } from 'date-fns';

const TREND_DAYS = 14;

// types

interface GroupAverage {
  label: string;
  avgScore: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

export const averageScore = (scores: (number | null)[]): number => {
  const valid = scores.filter((score): score is number => score !== null);
  if (valid.length === 0) return 0;

  return Math.round(valid.reduce((sum, score) => sum + score, 0) / valid.length);
};

export const groupAverageByLabel = (rows: { label: string | null; score: number }[]): GroupAverage[] => {
  const buckets = new Map<string, number[]>();

  for (const row of rows) {
    if (!row.label) continue;

    const bucket = buckets.get(row.label) ?? [];
    bucket.push(row.score);
    buckets.set(row.label, bucket);
  }

  return Array.from(buckets.entries())
    .map(([label, scores]) => ({ label, avgScore: averageScore(scores) }))
    .sort((a, b) => b.avgScore - a.avgScore);
};

export const dailyTrend = (dates: Date[], days: number = TREND_DAYS): TrendPoint[] => {
  const counts = new Map<string, number>();

  for (const date of dates) {
    const key = format(date, 'yyyy-MM-dd');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: TrendPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = format(subDays(new Date(), offset), 'yyyy-MM-dd');
    points.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return points;
};

export const trendRangeStart = (days: number = TREND_DAYS): Date => subDays(new Date(), days - 1);
