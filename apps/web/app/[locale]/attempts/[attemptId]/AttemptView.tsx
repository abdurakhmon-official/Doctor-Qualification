'use client';

import { useAttempt } from '@/hooks/use-exam-attempts';
import { ExamTakingView } from './ExamTakingView';
import { AttemptResultView } from './AttemptResultView';

export function AttemptView({ attemptId }: { attemptId: string }) {
  const { data: attempt } = useAttempt(attemptId);

  if (!attempt) return null;

  if (attempt.status === 'IN_PROGRESS') {
    return <ExamTakingView attempt={attempt} />;
  }

  return <AttemptResultView attempt={attempt} />;
}
