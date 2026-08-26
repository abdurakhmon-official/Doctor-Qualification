'use client';

import { Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AttemptInProgress, Locale, SubmitAttemptInput } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { pickLocalized } from '@/lib/localized';
import { assetUrl, cn } from '@/lib/utils';
import { useSubmitAttempt } from '@/hooks/use-exam-attempts';

const LOW_TIME_SECONDS = 60;

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export function ExamTakingView({ attempt }: { attempt: AttemptInProgress }) {
  const t = useTranslations('attempts.take');
  const locale = useLocale() as Locale;
  const submitAttempt = useSubmitAttempt();
  const hasSubmittedRef = useRef(false);

  const deadline = useMemo(
    () => new Date(attempt.startedAt).getTime() + attempt.durationMinutes * 60_000,
    [attempt.startedAt, attempt.durationMinutes],
  );

  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.max(0, Math.round((deadline - Date.now()) / 1000)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const submit = (input: SubmitAttemptInput) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    submitAttempt.mutate({ attemptId: attempt.id, input });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const next = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainingSeconds(next);

      if (next === 0) {
        clearInterval(interval);
        submit({ answers: answersRef.current });
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  const question = attempt.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / attempt.questions.length) * 100;
  const isLastQuestion = currentIndex === attempt.questions.length - 1;

  if (!question) return null;

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  };

  const onFinish = () => setConfirmingFinish(true);

  const onConfirmFinish = () => {
    setConfirmingFinish(false);
    submit({ answers });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex items-center gap-4">
        <Progress value={progress} className="flex-1" />
        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold tabular-nums',
            remainingSeconds <= LOW_TIME_SECONDS ? 'border-destructive text-destructive' : 'border-border text-foreground',
          )}
        >
          <Clock className="size-4" />
          {formatTime(remainingSeconds)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {attempt.questions.map((q, index) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'flex size-9 items-center justify-center rounded-full border text-sm font-medium transition-colors',
              index === currentIndex && 'border-primary ring-2 ring-primary/30',
              answers[q.id] !== undefined ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-lg font-medium">
          {currentIndex + 1}. {pickLocalized(question.text, locale)}
        </p>

        {question.imageKey && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(question.imageKey)} alt="" className="max-h-64 self-start rounded-lg object-contain" />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => (
            <button
              key={optionIndex}
              type="button"
              onClick={() => selectOption(optionIndex)}
              className={cn(
                'rounded-xl border-2 px-4 py-3 text-start transition-colors',
                answers[question.id] === optionIndex ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent',
              )}
            >
              <span className="font-semibold">{String.fromCharCode(65 + optionIndex)})</span> {pickLocalized(option, locale)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
          {t('previous')}
        </Button>

        {isLastQuestion ? (
          <Button type="button" onClick={onFinish} disabled={submitAttempt.isPending}>
            {submitAttempt.isPending ? t('submitting') : t('finish')}
          </Button>
        ) : (
          <Button type="button" onClick={() => setCurrentIndex((i) => i + 1)}>
            {t('next')}
          </Button>
        )}
      </div>

      <Modal open={confirmingFinish} onClose={() => setConfirmingFinish(false)} title={t('confirmFinishTitle')}>
        <p className="text-sm text-muted-foreground">{t('confirmFinish')}</p>
        <p className="text-sm font-medium">{t('confirmFinishAnswered', { answered: answeredCount, total: attempt.questions.length })}</p>

        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingFinish(false)}>
            {t('confirmFinishCancel')}
          </Button>
          <Button type="button" size="sm" onClick={onConfirmFinish}>
            {t('finish')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
