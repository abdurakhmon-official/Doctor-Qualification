import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
// the SDK's structured-output helper is built on the Zod 4 API, which zod@3.25 ships under "zod/v4"
import { z } from 'zod/v4';
import type { AnalysisMistake, AnalysisStudyItem, Locale, QuestionDifficulty } from '@repo/contracts';

const LETTERS = ['A', 'B', 'C', 'D'] as const;
const MAX_STUDY_ITEMS = 5;
const MAX_TIPS = 4;
const MAX_TEXT = 1200;
// answers at least this long are matched anywhere in the text
const MIN_LEAK_LENGTH = 4;

const LANGUAGE_NAMES: Record<Locale, string> = {
  uz: 'Uzbek (Latin script)',
  ru: 'Russian',
  en: 'English',
};

/** What Claude must return; checked by the SDK's structured-output parser. */
export const AnalysisOutputSchema = z.object({
  summary: z.string(),
  mistakes: z.array(z.object({ questionNumber: z.number().int(), keyConcept: z.string(), explanation: z.string() })),
  studyPlan: z.array(z.object({ topicId: z.string().nullable(), topic: z.string(), reason: z.string(), tips: z.array(z.string()) })),
  encouragement: z.string(),
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

// types

export interface AnalysisQuestion {
  number: number;
  text: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  topicId: string | null;
  topicName: string | null;
  difficulty: QuestionDifficulty;
}

export interface AnalysisContext {
  title: string;
  specialty: string;
  score: number;
  locale: Locale;
  questions: AnalysisQuestion[];
  /** The specialty's topics the study plan may point at. */
  topics: { id: string; name: string }[];
  revealCorrectAnswers: boolean;
}

export interface AnalysisRequestOptions {
  model: string;
}

export class AiRefusedError extends Error {}
export class AiInvalidOutputError extends Error {}

const BASE_RULES = `You are a medical education tutor on Doctor Qualification, a platform where licensed physicians practise for and take specialty qualification tests. You review one finished test for the physician who took it.

Your feedback is educational. It is not advice about any real patient, and you never suggest that it replaces clinical guidelines or senior review.

Ground every explanation in widely accepted clinical guidelines and textbook knowledge. If a question looks ambiguous or its keyed answer looks outdated, say so plainly instead of inventing a justification.

Write for a busy doctor: precise, specific and short. Prefer the mechanism or decision rule that makes the answer clear over general encouragement.

Fill in the requested structure:
- summary: two or three sentences on how the test went and the main pattern behind the mistakes.
- mistakes: one entry for each question you are given as answered wrongly or left unanswered, using its question number. keyConcept names the concept being tested in a few words; explanation (at most four sentences) explains the concept and why the physician's chosen answer does not fit. For an unanswered question, explain the concept only.
- studyPlan: at most five topics to revisit, most important first. Use a topicId from the provided topic list when the advice matches that topic, otherwise null. Give each a one-sentence reason and two to four concrete study tips.
- encouragement: one sentence.`;

const NO_REVEAL_RULE = `These questions also appear in certification exams, so the feedback must not give the answers away: never state, quote or hint which option is correct, and never refer to options by their letter. Explain the underlying concept so the physician can work the answer out.`;

const REVEAL_RULE = `You may name the correct option and quote it when that makes the explanation clearer.`;

export const analysisSystemPrompt = (revealCorrectAnswers: boolean): string =>
  `${BASE_RULES}\n\n${revealCorrectAnswers ? REVEAL_RULE : NO_REVEAL_RULE}`;

const optionLine = (question: AnalysisQuestion, index: number): string => {
  const marks = [index === question.selectedIndex ? 'chosen' : null, index === question.correctIndex ? 'keyed correct' : null].filter(Boolean);
  return `   ${LETTERS[index]}) ${question.options[index]}${marks.length ? ` [${marks.join(', ')}]` : ''}`;
};

/** The per-attempt user message: missed questions in full, correct ones as a one-line tally. */
export const buildAnalysisPrompt = (context: AnalysisContext): string => {
  const missed = context.questions.filter((question) => question.selectedIndex !== question.correctIndex);
  const correct = context.questions.filter((question) => question.selectedIndex === question.correctIndex);

  const missedBlock = missed
    .map((question) =>
      [
        `Question ${question.number} (topic: ${question.topicName ?? 'none'}, difficulty: ${question.difficulty.toLowerCase()}) - ${
          question.selectedIndex === null ? 'not answered' : 'answered wrongly'
        }`,
        `   ${question.text}`,
        ...question.options.map((_, index) => optionLine(question, index)),
      ].join('\n'),
    )
    .join('\n\n');

  const correctLine = correct.length
    ? correct.map((question) => `${question.number} (${question.topicName ?? 'no topic'})`).join(', ')
    : 'none';

  const topics = context.topics.length ? context.topics.map((topic) => `- ${topic.id}: ${topic.name}`).join('\n') : '(no topics defined)';

  return `<test>
Title: ${context.title}
Specialty: ${context.specialty}
Score: ${context.score}% (${correct.length} of ${context.questions.length} correct)
</test>

<topics>
${topics}
</topics>

<answered_correctly>
Questions ${correctLine}
</answered_correctly>

<to_review>
${missedBlock || '(none - every question was answered correctly)'}
</to_review>

Write the whole response in ${LANGUAGE_NAMES[context.locale]}.`;
};

/** One Messages API call; refusals and unusable output become typed errors for the service to map. */
export const requestAnalysis = async (client: Anthropic, context: AnalysisContext, { model }: AnalysisRequestOptions) => {
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    // feedback on one test: medium depth is plenty and keeps latency reasonable
    output_config: { effort: 'medium', format: betaZodOutputFormat(AnalysisOutputSchema) },
    // a safety decline is retried server-side on the recommended fallback model instead of failing
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: analysisSystemPrompt(context.revealCorrectAnswers),
    messages: [{ role: 'user', content: buildAnalysisPrompt(context) }],
  });

  if (response.stop_reason === 'refusal') throw new AiRefusedError(response.stop_details?.category ?? 'refusal');
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) throw new AiInvalidOutputError(String(response.stop_reason));

  return {
    output: response.parsed_output,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
};

const normalize = (value: string) => value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
const clip = (value: string) => value.trim().slice(0, MAX_TEXT);
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A test for "this text quotes the keyed answer". Long answers match anywhere. Short ones only count when they
 * carry a digit or symbol ("≥30", "4.5", "B12") and stand alone, so "30" inside "2030" is not a hit. Short plain
 * words ("No", "Yes") are too common in prose to judge and are ignored.
 */
const leakMatcher = (answer: string): ((text: string) => boolean) | null => {
  if (answer.length >= MIN_LEAK_LENGTH) return (text) => text.includes(answer);
  if (answer.length < 2 || !/[^\p{L}\s]/u.test(answer)) return null;

  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(answer)}(?![\\p{L}\\p{N}])`, 'u');
  return (text) => pattern.test(text);
};

/**
 * Makes model output safe to show: keeps only mistakes for questions actually missed, only known topic ids,
 * bounded lengths - and, unless revealing is allowed, drops any text that quotes a missed question's keyed answer.
 */
export const sanitizeAnalysis = (
  output: AnalysisOutput,
  context: AnalysisContext,
): { summary: string; mistakes: AnalysisMistake[]; studyPlan: AnalysisStudyItem[]; encouragement: string; redacted: number } => {
  const missed = context.questions.filter((question) => question.selectedIndex !== question.correctIndex);
  const missedNumbers = new Set(missed.map((question) => question.number));
  const matchers = missed
    .map((question) => leakMatcher(normalize(question.options[question.correctIndex] ?? '')))
    .filter((matcher): matcher is (text: string) => boolean => matcher !== null);
  const topicIds = new Set(context.topics.map((topic) => topic.id));

  let redacted = 0;
  const leaks = (text: string) => !context.revealCorrectAnswers && matchers.some((matches) => matches(normalize(text)));
  const keep = (...texts: string[]) => {
    if (texts.some(leaks)) {
      redacted++;
      return false;
    }
    return true;
  };

  const seen = new Set<number>();
  const mistakes = output.mistakes
    .filter((mistake) => missedNumbers.has(mistake.questionNumber) && !seen.has(mistake.questionNumber) && seen.add(mistake.questionNumber))
    .filter((mistake) => keep(mistake.keyConcept, mistake.explanation))
    .map((mistake) => ({ questionNumber: mistake.questionNumber, keyConcept: clip(mistake.keyConcept), explanation: clip(mistake.explanation) }))
    .sort((a, b) => a.questionNumber - b.questionNumber);

  const studyPlan = output.studyPlan
    .filter((item) => keep(item.topic, item.reason))
    .slice(0, MAX_STUDY_ITEMS)
    .map((item) => ({
      topicId: item.topicId && topicIds.has(item.topicId) ? item.topicId : null,
      topic: clip(item.topic),
      reason: clip(item.reason),
      tips: item.tips.filter((tip) => keep(tip)).slice(0, MAX_TIPS).map(clip),
    }));

  return {
    summary: keep(output.summary) ? clip(output.summary) : '',
    mistakes,
    studyPlan,
    encouragement: keep(output.encouragement) ? clip(output.encouragement) : '',
    redacted,
  };
};
