'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { ProgressPoint } from '@repo/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// palette slots 1–2 (blue, orange), validated for CVD/contrast on the app's light and dark card surfaces
const SERIES_VARS = '[--series-exam:#2a78d6] [--series-practice:#eb6834] dark:[--series-exam:#3987e5] dark:[--series-practice:#d95926]';

const SERIES = [
  { key: 'exam', kind: 'EXAM', color: 'var(--series-exam)' },
  { key: 'practice', kind: 'PRACTICE', color: 'var(--series-practice)' },
] as const;

type SeriesKey = (typeof SERIES)[number]['key'];
type Row = { t: number } & Record<SeriesKey, number | null>;

export function ProgressChart({ timeline }: { timeline: ProgressPoint[] }) {
  const t = useTranslations('profile.progress');
  const locale = useLocale();

  const rows: Row[] = timeline.map((point) => ({
    t: new Date(point.date).getTime(),
    exam: point.kind === 'EXAM' ? point.score : null,
    practice: point.kind === 'PRACTICE' ? point.score : null,
  }));

  const formatDay = (time: number) => new Date(time).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const seriesLabel = (key: SeriesKey) => (key === 'exam' ? t('exam') : t('practice'));
  const lastIndex = (key: SeriesKey) => rows.findLastIndex((row) => row[key] !== null);
  const visibleSeries = SERIES.filter((series) => lastIndex(series.key) !== -1);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t('title')}</CardTitle>
        {visibleSeries.length > 1 && (
          <ul className={`flex gap-4 text-sm text-muted-foreground ${SERIES_VARS}`}>
            {visibleSeries.map((series) => (
              <li key={series.key} className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: series.color }} aria-hidden />
                {seriesLabel(series.key)}
              </li>
            ))}
          </ul>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <>
            <div className={`h-60 w-full ${SERIES_VARS}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 8, right: 72, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatDay}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                    className="fill-muted-foreground"
                  />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" fontSize={12} tickLine={false} axisLine={false} width={44} />
                  <Tooltip
                    cursor={{ className: 'stroke-border', strokeWidth: 1 }}
                    content={({ active, payload, label }) => (
                      <ProgressTooltip active={active} payload={payload} label={label} formatDay={formatDay} seriesLabel={seriesLabel} />
                    )}
                  />
                  {visibleSeries.map((series) => (
                    <Line
                      key={series.key}
                      dataKey={series.key}
                      name={seriesLabel(series.key)}
                      stroke={series.color}
                      strokeWidth={2}
                      connectNulls
                      isAnimationActive={false}
                      dot={{ r: 4, fill: series.color, strokeWidth: 2, className: 'stroke-card' }}
                      activeDot={{ r: 6, fill: series.color, strokeWidth: 2, className: 'stroke-card' }}
                      // direct label on the newest point only, so identity never rests on color alone
                      label={({ x, y, index }: { x?: number; y?: number; index?: number }) =>
                        index === lastIndex(series.key) && x !== undefined && y !== undefined ? (
                          <text x={x + 10} y={y} dy={4} fontSize={12} className="fill-muted-foreground">
                            {seriesLabel(series.key)}
                          </text>
                        ) : (
                          <g />
                        )
                      }
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">{t('asTable')}</summary>
              <table className="mt-2 w-full text-start">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 text-start font-medium">{t('date')}</th>
                    <th className="py-1 text-start font-medium">{t('type')}</th>
                    <th className="py-1 text-end font-medium">{t('score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...timeline].reverse().map((point, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="py-1">{new Date(point.date).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="py-1">{point.kind === 'EXAM' ? t('exam') : t('practice')}</td>
                      <td className="py-1 text-end tabular-nums">{point.score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressTooltipProps extends Pick<TooltipProps<ValueType, NameType>, 'active' | 'payload' | 'label'> {
  formatDay: (time: number) => string;
  seriesLabel: (key: SeriesKey) => string;
}

function ProgressTooltip({ active, payload, label, formatDay, seriesLabel }: ProgressTooltipProps) {
  const entries = payload?.filter((entry) => entry.value !== null && entry.value !== undefined) ?? [];
  if (!active || !entries.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-muted-foreground">{formatDay(Number(label))}</p>
      {entries.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: entry.color }} aria-hidden />
          <span>{seriesLabel(entry.dataKey as SeriesKey)}</span>
          <span className="ms-auto font-semibold tabular-nums">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
}
