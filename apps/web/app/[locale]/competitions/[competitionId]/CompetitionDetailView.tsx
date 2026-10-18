'use client';

import { CalendarClock, Clock, Medal, Radio, Trophy, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CompetitionDetail, CompetitionEntryResult, LeaderboardRow, Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AiAnalysisCard } from '@/components/ai/AiAnalysisCard';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { ResultReviewList, ResultTopicsCard } from '@/components/report/ResultSections';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { cn } from '@/lib/utils';
import { useCompetition, useCompetitionEntry, useStartCompetitionEntry, useSubmitCompetitionEntry } from '@/hooks/use-competitions';

// medal tints are decorative: the place number always sits next to the icon
const MEDAL_STYLES: Record<number, string> = {
  1: 'text-amber-500',
  2: 'text-slate-400',
  3: 'text-orange-600 dark:text-orange-500',
};

const formatDuration = (totalSeconds: number) => `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;

export function CompetitionDetailView({ competitionId }: { competitionId: string }) {
  const t = useTranslations('competitions');
  const { data: competition } = useCompetition(competitionId);
  const { data: entry } = useCompetitionEntry(competitionId, Boolean(competition?.myEntry));
  const submitEntry = useSubmitCompetitionEntry();

  if (!competition) return null;

  if (entry?.status === 'IN_PROGRESS') {
    return (
      <QuizRunner
        key={entry.id}
        questions={entry.questions}
        deadline={new Date(entry.deadline).getTime()}
        isSubmitting={submitEntry.isPending}
        onSubmit={(answers) => submitEntry.mutate({ competitionId, input: { answers } })}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href="/competitions" className="text-sm text-muted-foreground hover:underline">
        ← {t('backToList')}
      </Link>

      <InfoCard competition={competition} />
      {entry?.status === 'SUBMITTED' && <EntryResult result={entry} />}
      <Leaderboard competition={competition} />
      {entry?.status === 'SUBMITTED' && (
        <>
          <AiAnalysisCard
            kind="COMPETITION"
            attemptId={entry.id}
            specialtyId={competition.specialtyId}
            blockedReason={competition.status === 'FINISHED' ? undefined : t('aiAfterFinish')}
          />
          <ResultTopicsCard topics={entry.topics} />
          <ResultReviewList questions={entry.questions} />
        </>
      )}
    </div>
  );
}

function InfoCard({ competition }: { competition: CompetitionDetail }) {
  const t = useTranslations('competitions');
  const locale = useLocale() as Locale;
  const startEntry = useStartCompetitionEntry();
  const format = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{pickLocalized(competition.title, locale)}</h1>
            <p className="text-muted-foreground">{pickLocalized(competition.specialtyName, locale)}</p>
          </div>
          <div className="flex gap-1.5">
            {competition.isWeekly && <Badge>{t('weekly')}</Badge>}
            <Badge variant={competition.status === 'ACTIVE' ? 'success' : competition.status === 'UPCOMING' ? 'warning' : 'default'}>
              {t(`status.${competition.status}`)}
            </Badge>
          </div>
        </div>

        {competition.description && <p className="text-sm text-muted-foreground">{pickLocalized(competition.description, locale)}</p>}

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-4 shrink-0" />
            {format(competition.startsAt)} — {format(competition.endsAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 shrink-0" />
            {t('format', { count: competition.questionCount, minutes: competition.durationMinutes })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4 shrink-0" />
            {t('participants', { count: competition.participantCount })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">{t('rules')}</p>

        {competition.status === 'ACTIVE' && !competition.myEntry && (
          <Button size="lg" disabled={startEntry.isPending} onClick={() => startEntry.mutate(competition.id)}>
            <Trophy className="size-4" />
            {startEntry.isPending ? t('starting') : t('actions.join')}
          </Button>
        )}
        {competition.status === 'UPCOMING' && <p className="text-sm font-medium">{t('startsAt', { date: format(competition.startsAt) })}</p>}
        {competition.status === 'FINISHED' && !competition.myEntry && <p className="text-sm text-muted-foreground">{t('missed')}</p>}
      </CardContent>
    </Card>
  );
}

function EntryResult({ result }: { result: CompetitionEntryResult }) {
  const t = useTranslations('competitions.result');

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">{t('yourResult')}</p>
        <p className="text-4xl font-bold">{result.score}%</p>
        <p className="flex items-center gap-1.5 font-medium">
          <Medal className={cn('size-5', MEDAL_STYLES[result.rank] ?? 'text-primary')} />
          {t('place', { rank: result.rank, total: result.participantCount })}
        </p>
        {result.expired && <p className="text-sm text-destructive">{t('expired')}</p>}
        <p className="text-sm text-muted-foreground">
          {t('summary', { correct: result.correctCount, total: result.questionCount, time: formatDuration(result.timeSpentSeconds) })}
        </p>
      </CardContent>
    </Card>
  );
}

function Leaderboard({ competition }: { competition: CompetitionDetail }) {
  const t = useTranslations('competitions.leaderboard');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{t('title')}</CardTitle>
        {competition.status === 'ACTIVE' && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('live')}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {!competition.leaderboard.length ? (
          <EmptyState icon={Users} title={t('empty')} className="py-6" />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="w-14 py-2 text-start font-medium">#</th>
                <th className="py-2 text-start font-medium">{t('doctor')}</th>
                <th className="py-2 text-end font-medium">{t('score')}</th>
                <th className="py-2 text-end font-medium">{t('time')}</th>
              </tr>
            </thead>
            <tbody>
              {competition.leaderboard.map((row, index) => (
                <LeaderboardRowView key={`${row.rank}-${index}`} row={row} separated={index > 0 && row.isMe && competition.leaderboard[index - 1]!.rank + 1 < row.rank} />
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function LeaderboardRowView({ row, separated }: { row: LeaderboardRow; separated: boolean }) {
  const t = useTranslations('competitions.leaderboard');

  return (
    <tr className={cn('border-t border-border', row.isMe && 'bg-primary/5 font-semibold', separated && 'border-t-4 border-double')}>
      <td className="py-2 tabular-nums">
        <span className="flex items-center gap-1">
          {row.rank <= 3 && <Medal className={cn('size-4', MEDAL_STYLES[row.rank])} aria-hidden />}
          {row.rank}
        </span>
      </td>
      <td className="py-2">
        {row.fullName}
        {row.isMe && <span className="ms-1.5 text-xs font-normal text-muted-foreground">({t('you')})</span>}
      </td>
      <td className="py-2 text-end tabular-nums">{row.score}%</td>
      <td className="py-2 text-end tabular-nums">{formatDuration(row.timeSpentSeconds)}</td>
    </tr>
  );
}
