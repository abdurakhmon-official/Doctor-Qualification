const DAY_MS = 24 * 60 * 60 * 1000;

// types

export interface GradableAnswerQuestion {
  correctIndex: number;
  topicId: string | null;
  specialtyId: string;
}

export interface TopicTally {
  topicId: string | null;
  specialtyId: string;
  correct: number;
  answered: number;
}

/** Calendar day (yyyy-mm-dd) of `date` in the viewer's zone; `tzOffset` uses getTimezoneOffset() minutes. */
export const dayKey = (date: Date, tzOffset: number): string => new Date(date.getTime() - tzOffset * 60_000).toISOString().slice(0, 10);

/**
 * Consecutive active days ending today, or ending yesterday when nothing has happened yet today
 * (the streak is still alive until the day is over).
 */
export const activityStreak = (dates: Date[], tzOffset: number, now: Date = new Date()): { streakDays: number; activeToday: boolean } => {
  const days = new Set(dates.map((date) => dayKey(date, tzOffset)));
  const today = dayKey(now, tzOffset);
  const activeToday = days.has(today);

  let cursor = activeToday ? now.getTime() : now.getTime() - DAY_MS;
  let streakDays = 0;

  while (days.has(dayKey(new Date(cursor), tzOffset))) {
    streakDays++;
    cursor -= DAY_MS;
  }

  return { streakDays, activeToday };
};

/** Per (specialty, topic) correct/answered counts. Answers to questions that no longer exist are ignored. */
export const tallyTopics = (
  answerSets: Record<string, number>[],
  questions: Map<string, GradableAnswerQuestion>,
): { tallies: TopicTally[]; correct: number; answered: number } => {
  const tallies = new Map<string, TopicTally>();
  let correct = 0;
  let answered = 0;

  for (const answers of answerSets) {
    for (const [questionId, selected] of Object.entries(answers)) {
      const question = questions.get(questionId);
      if (!question) continue;

      const key = `${question.specialtyId}:${question.topicId ?? ''}`;
      const tally = tallies.get(key) ?? { topicId: question.topicId, specialtyId: question.specialtyId, correct: 0, answered: 0 };
      const isCorrect = selected === question.correctIndex;

      tally.answered++;
      answered++;
      if (isCorrect) {
        tally.correct++;
        correct++;
      }
      tallies.set(key, tally);
    }
  }

  return { tallies: [...tallies.values()], correct, answered };
};
