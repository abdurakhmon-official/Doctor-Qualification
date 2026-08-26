'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AttemptSubmitted, Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { cn } from '@/lib/utils';

const CIRCLE_RADIUS = 54;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const LEVEL_BADGE_VARIANT = {
  BEGINNER: 'default',
  INTERMEDIATE: 'warning',
  GOOD: 'default',
  HIGH: 'success',
  EXPERT: 'success',
} as const;

export function AttemptResultView({ attempt }: { attempt: AttemptSubmitted }) {
  const t = useTranslations('attempts.result');
  const locale = useLocale() as Locale;
  const minutes = Math.floor(attempt.timeSpentSeconds / 60);
  const seconds = attempt.timeSpentSeconds % 60;
  const offset = CIRCLE_CIRCUMFERENCE - (attempt.score / 100) * CIRCLE_CIRCUMFERENCE;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-12">
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="relative flex size-36 items-center justify-center">
            <svg viewBox="0 0 120 120" className="size-36 -rotate-90">
              <circle cx="60" cy="60" r={CIRCLE_RADIUS} fill="none" strokeWidth="10" className="stroke-accent" />
              <circle
                cx="60"
                cy="60"
                r={CIRCLE_RADIUS}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={offset}
                className={cn(attempt.certificateIssued ? 'stroke-emerald-500' : 'stroke-primary')}
              />
            </svg>
            <span className="absolute text-3xl font-bold">{attempt.score}%</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-lg font-semibold">{pickLocalized(attempt.examTitle, locale)}</p>
            <Badge variant={LEVEL_BADGE_VARIANT[attempt.level]}>{t(`level.${attempt.level}`)}</Badge>
            <p className={cn('font-medium', attempt.certificateIssued ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
              {attempt.certificateIssued ? t('certificateIssued') : t('certificateNotIssued', { minScore: attempt.minCertificateScore })}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 text-start sm:grid-cols-4">
            <Stat label={t('totalQuestions')} value={String(attempt.questionCount)} />
            <Stat label={t('correct')} value={String(attempt.correctCount)} />
            <Stat label={t('incorrect')} value={String(attempt.questionCount - attempt.correctCount)} />
            <Stat label={t('timeSpent')} value={`${minutes}:${String(seconds).padStart(2, '0')}`} />
          </div>

          <div className="flex w-full gap-3">
            <Link href="/exams" className="flex-1">
              <Button variant="outline" className="w-full">
                {t('backToExams')}
              </Button>
            </Link>
            <Link href="/profile" className="flex-1">
              <Button className="w-full">{t('viewHistory')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
