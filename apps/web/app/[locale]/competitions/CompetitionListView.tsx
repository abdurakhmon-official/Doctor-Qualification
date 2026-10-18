'use client';

import { CalendarClock, Medal, Trophy, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CompetitionListItem, CompetitionStatus, Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { useCompetitions } from '@/hooks/use-competitions';

const SECTIONS: CompetitionStatus[] = ['ACTIVE', 'UPCOMING', 'FINISHED'];

export function CompetitionListView() {
  const t = useTranslations('competitions');
  const { data: competitions } = useCompetitions();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {competitions && !competitions.length && <EmptyState icon={Trophy} title={t('empty')} />}

      {SECTIONS.map((status) => {
        const items = competitions?.filter((competition) => competition.status === status) ?? [];
        if (!items.length) return null;

        return (
          <section key={status} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(`sections.${status}`)}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function CompetitionCard({ competition }: { competition: CompetitionListItem }) {
  const t = useTranslations('competitions');
  const locale = useLocale() as Locale;
  const format = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const mine = competition.myEntry;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{pickLocalized(competition.title, locale)}</p>
            <p className="text-sm text-muted-foreground">{pickLocalized(competition.specialtyName, locale)}</p>
          </div>
          {competition.isWeekly && <Badge>{t('weekly')}</Badge>}
        </div>

        {competition.description && <p className="text-sm text-muted-foreground">{pickLocalized(competition.description, locale)}</p>}

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-4" />
            {format(competition.startsAt)} — {format(competition.endsAt)}
          </span>
          <span>{t('format', { count: competition.questionCount, minutes: competition.durationMinutes })}</span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {t('participants', { count: competition.participantCount })}
          </span>
        </div>

        {mine?.status === 'SUBMITTED' && (
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Medal className="size-4 text-primary" />
            {t('myPlace', { rank: mine.rank ?? 0, score: mine.score ?? 0 })}
          </p>
        )}

        <div className="mt-auto pt-1">
          <Link href={{ pathname: '/competitions/[competitionId]', params: { competitionId: competition.id } }}>
            <Button size="sm" className="w-full" variant={competition.status === 'ACTIVE' && !mine ? 'default' : 'outline'}>
              {mine?.status === 'IN_PROGRESS'
                ? t('actions.continue')
                : competition.status === 'ACTIVE' && !mine
                  ? t('actions.join')
                  : competition.status === 'UPCOMING'
                    ? t('actions.details')
                    : t('actions.results')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
