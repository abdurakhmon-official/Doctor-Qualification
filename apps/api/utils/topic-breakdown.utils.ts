import type { AttemptTopicResult, LocalizedText } from '@repo/contracts';

// types

interface BreakdownQuestion {
  id: string;
  correctIndex: number;
  topicId: string | null;
  topic: { name: unknown } | null;
}

/** Correct/total per topic for one attempt (unanswered counts as wrong), weakest topic first. */
export const topicBreakdown = (questions: BreakdownQuestion[], answers: Record<string, number>): AttemptTopicResult[] => {
  const topics = new Map<string, AttemptTopicResult>();

  for (const question of questions) {
    const key = question.topicId ?? '';
    const entry = topics.get(key) ?? {
      topicId: question.topicId,
      topicName: (question.topic?.name ?? null) as LocalizedText | null,
      correct: 0,
      total: 0,
    };

    entry.total++;
    if (answers[question.id] === question.correctIndex) entry.correct++;
    topics.set(key, entry);
  }

  return [...topics.values()].sort((a, b) => a.correct / a.total - b.correct / b.total);
};
