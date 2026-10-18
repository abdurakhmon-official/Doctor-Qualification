'use client';

import { useMemo } from 'react';
import type { AttemptInProgress } from '@repo/contracts';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { useSubmitAttempt } from '@/hooks/use-exam-attempts';

export function ExamTakingView({ attempt }: { attempt: AttemptInProgress }) {
  const submitAttempt = useSubmitAttempt();

  const deadline = useMemo(
    () => new Date(attempt.startedAt).getTime() + attempt.durationMinutes * 60_000,
    [attempt.startedAt, attempt.durationMinutes],
  );

  return (
    <QuizRunner
      questions={attempt.questions}
      deadline={deadline}
      isSubmitting={submitAttempt.isPending}
      onSubmit={(answers) => submitAttempt.mutate({ attemptId: attempt.id, input: { answers } })}
    />
  );
}
