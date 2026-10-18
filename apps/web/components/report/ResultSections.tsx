'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { AttemptReviewQuestion, AttemptTopicResult, Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { pickLocalized } from '@/lib/localized';
import { cn } from '@/lib/utils';

/** Per-topic correct/total bars, shared by the exam and practice result screens. */
export function ResultTopicsCard({ topics }: { topics: AttemptTopicResult[] }) {
  const t = useTranslations('report');
  const locale = useLocale() as Locale;

  if (!topics.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('byTopic')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {topics.map((topic) => {
          const percent = Math.round((topic.correct / topic.total) * 100);
          return (
            <div key={topic.topicId ?? 'none'} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{topic.topicName ? pickLocalized(topic.topicName, locale) : t('noTopic')}</span>
                <span className="text-muted-foreground tabular-nums">
                  {topic.correct}/{topic.total} · {percent}%
                </span>
              </div>
              <Progress value={percent} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** Every question with the user's own answer marked right or wrong; the correct option is never revealed. */
export function ResultReviewList({ questions }: { questions: AttemptReviewQuestion[] }) {
  const t = useTranslations('report');
  const tDifficulty = useTranslations('admin.exams.questions.difficultyLevel');
  const locale = useLocale() as Locale;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('review')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {questions.map((question, index) => {
          const selected = question.selectedIndex === null ? undefined : question.options[question.selectedIndex];
          return (
            <div
              key={index}
              className={cn('flex flex-col gap-2 rounded-lg border p-4', question.isCorrect ? 'border-emerald-500/40' : 'border-destructive/40')}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  {index + 1}. {pickLocalized(question.text, locale)}
                </p>
                {question.isCorrect ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={t('correct')} />
                ) : (
                  <XCircle className="size-5 shrink-0 text-destructive" aria-label={t('incorrect')} />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('yourAnswer')}:{' '}
                {question.selectedIndex === null || !selected ? (
                  <span className="italic">{t('notAnswered')}</span>
                ) : (
                  <span className="text-foreground">
                    {String.fromCharCode(65 + question.selectedIndex)}) {pickLocalized(selected, locale)}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={question.topicName ? 'default' : 'warning'}>
                  {question.topicName ? pickLocalized(question.topicName, locale) : t('noTopic')}
                </Badge>
                <Badge>{tDifficulty(question.difficulty)}</Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
