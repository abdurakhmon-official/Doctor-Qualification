import type { AttemptQuestion, AttemptReviewQuestion, LocalizedText } from '@repo/contracts';
import prisma from '@/modules/db';
import { EXAM_STATUS, type Prisma } from '../generated/prisma';

/** Questions self-study and contests may draw from: published exams only, since drafts may still be unreviewed. */
export const publishedPoolWhere = (specialtyId: string, topicIds: string[]): Prisma.QuestionWhereInput => ({
  exam: { specialtyId, status: EXAM_STATUS.PUBLISHED },
  ...(topicIds.length ? { topicId: { in: topicIds } } : {}),
});

export const FROZEN_QUESTION_SELECT = {
  id: true,
  text: true,
  options: true,
  correctIndex: true,
  difficulty: true,
  imageKey: true,
  order: true,
  topicId: true,
  topic: { select: { name: true } },
} satisfies Prisma.QuestionSelect;

export type FrozenQuestion = Prisma.QuestionGetPayload<{ select: typeof FROZEN_QUESTION_SELECT }>;

/** Loads a question set frozen at start (practice, competitions) in its stored order; questions deleted since are skipped. */
export const loadFrozenQuestions = async (questionIds: string[]): Promise<FrozenQuestion[]> => {
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } }, select: FROZEN_QUESTION_SELECT });
  const byId = new Map(questions.map((question) => [question.id, question]));

  return questionIds.map((id) => byId.get(id)).filter((question): question is FrozenQuestion => Boolean(question));
};

/** What an open attempt may see: never the correct index. */
export const toAttemptQuestion = ({ id, text, options, imageKey, order }: FrozenQuestion): AttemptQuestion => ({
  id,
  text: text as LocalizedText,
  options: options as LocalizedText[],
  imageKey,
  order,
});

export const toReviewQuestion = (question: FrozenQuestion, answers: Record<string, number>): AttemptReviewQuestion => ({
  text: question.text as LocalizedText,
  options: question.options as LocalizedText[],
  selectedIndex: answers[question.id] ?? null,
  isCorrect: answers[question.id] === question.correctIndex,
  topicName: (question.topic?.name ?? null) as LocalizedText | null,
  difficulty: question.difficulty,
});

/** Score over the frozen count, so questions deleted after the start count as wrong instead of vanishing. */
export const scoreOver = (correctCount: number, questionCount: number): number =>
  questionCount === 0 ? 0 : Math.round((correctCount / questionCount) * 100);
