'use client';

import { RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, PracticeInProgress, PracticeSubmitted } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { AiAnalysisCard } from '@/components/ai/AiAnalysisCard';
import { DownloadReportButton } from '@/components/report/DownloadReportButton';
import { ResultReviewList, ResultTopicsCard } from '@/components/report/ResultSections';
import { Link, useRouter } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { LEVEL_BADGE_VARIANT } from '@/lib/utils';
import { usePractice, useStartPractice, useSubmitPractice } from '@/hooks/use-practice';

const CIRCLE_RADIUS = 54;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function PracticeAttemptView({ attemptId }: { attemptId: string }) {
  const { data: attempt } = usePractice(attemptId);

  if (!attempt) return null;

  return attempt.status === 'IN_PROGRESS' ? <PracticeTakingView attempt={attempt} /> : <PracticeResultView attempt={attempt} />;
}

function PracticeTakingView({ attempt }: { attempt: PracticeInProgress }) {
  const submitPractice = useSubmitPractice();

  return (
    <QuizRunner
      questions={attempt.questions}
      deadline={null}
      isSubmitting={submitPractice.isPending}
      onSubmit={(answers) => submitPractice.mutate({ attemptId: attempt.id, input: { answers } })}
    />
  );
}

function PracticeResultView({ attempt }: { attempt: PracticeSubmitted }) {
  const t = useTranslations('practice.result');
  const tLevel = useTranslations('attempts.result.level');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const startPractice = useStartPractice();
  const minutes = Math.floor(attempt.timeSpentSeconds / 60);
  const seconds = attempt.timeSpentSeconds % 60;
  const offset = CIRCLE_CIRCUMFERENCE - (attempt.score / 100) * CIRCLE_CIRCUMFERENCE;

  const onRetry = async () => {
    try {
      const next = await startPractice.mutateAsync({
        specialtyId: attempt.specialtyId,
        topicIds: attempt.topicIds,
        difficulty: attempt.difficulty,
        questionCount: attempt.questionCount,
      });
      router.push({ pathname: '/practice/[attemptId]', params: { attemptId: next.id } });
    } catch {
      // the axios interceptor already shows the server message as a toast
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
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
                className="stroke-primary"
              />
            </svg>
            <span className="absolute text-3xl font-bold">{attempt.score}%</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-lg font-semibold">{pickLocalized(attempt.specialtyName, locale)}</p>
            <Badge variant={LEVEL_BADGE_VARIANT[attempt.level]}>{tLevel(attempt.level)}</Badge>
            <p className="text-sm text-muted-foreground">{t('practiceNote')}</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t('totalQuestions')} value={String(attempt.questionCount)} />
            <Stat label={t('correct')} value={String(attempt.correctCount)} />
            <Stat label={t('incorrect')} value={String(attempt.questionCount - attempt.correctCount)} />
            <Stat label={t('timeSpent')} value={`${minutes}:${String(seconds).padStart(2, '0')}`} />
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link href="/practice" className="flex-1">
              <Button variant="outline" className="w-full">
                {t('backToPractice')}
              </Button>
            </Link>
            <Button className="flex-1" disabled={startPractice.isPending} onClick={onRetry}>
              <RotateCcw className="size-4" />
              {t('retry')}
            </Button>
          </div>

          <DownloadReportButton attempt={attempt} className="w-full" />
        </CardContent>
      </Card>

      <AiAnalysisCard kind="PRACTICE" attemptId={attempt.id} specialtyId={attempt.specialtyId} />
      <ResultTopicsCard topics={attempt.topics} />
      <ResultReviewList questions={attempt.questions} />
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
