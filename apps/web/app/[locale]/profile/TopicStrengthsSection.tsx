'use client';

import { Dumbbell } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, TopicProgress } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';

// fewer answers than this say more about luck than about knowledge
const MIN_ANSWERED = 3;
const WEAK_BELOW = 70;
const STRONG_FROM = 80;
const MAX_ROWS = 5;

export function TopicStrengthsSection({ topics }: { topics: TopicProgress[] }) {
  const t = useTranslations('profile.topics');

  const reliable = topics.filter((topic) => topic.answered >= MIN_ANSWERED);
  // `topics` arrives weakest first
  const weak = reliable.filter((topic) => topic.accuracy < WEAK_BELOW).slice(0, MAX_ROWS);
  const strong = reliable
    .filter((topic) => topic.accuracy >= STRONG_FROM)
    .reverse()
    .slice(0, MAX_ROWS);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('weakTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('weakHint')}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {weak.length ? weak.map((topic) => <TopicRow key={rowKey(topic)} topic={topic} practice />) : <Empty text={t('weakEmpty')} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('strongTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('strongHint')}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {strong.length ? strong.map((topic) => <TopicRow key={rowKey(topic)} topic={topic} />) : <Empty text={t('strongEmpty', { min: MIN_ANSWERED })} />}
        </CardContent>
      </Card>
    </div>
  );
}

const rowKey = (topic: TopicProgress) => `${topic.specialtyId}:${topic.topicId ?? ''}`;

function TopicRow({ topic, practice = false }: { topic: TopicProgress; practice?: boolean }) {
  const t = useTranslations('profile.topics');
  const locale = useLocale() as Locale;
  const specialty = pickLocalized(topic.specialtyName, locale);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium">{topic.topicName ? pickLocalized(topic.topicName, locale) : t('noTopic')}</p>
          <p className="truncate text-xs text-muted-foreground">{specialty}</p>
        </div>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {topic.correct}/{topic.answered} · {topic.accuracy}%
        </span>
      </div>
      <Progress value={topic.accuracy} />
      {practice && (
        <Link
          href={{ pathname: '/practice', query: { specialtyId: topic.specialtyId, ...(topic.topicId ? { topicId: topic.topicId } : {}) } }}
          className="self-start"
        >
          <Button size="sm" variant="outline">
            <Dumbbell className="size-4" />
            {t('practiceTopic')}
          </Button>
        </Link>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
