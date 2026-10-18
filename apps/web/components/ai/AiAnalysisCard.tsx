'use client';

import { Dumbbell, Info, Loader2, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { AnalysisKind, AttemptAnalysisOutput, Locale } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { useAiStatus, useAnalysis, useGenerateAnalysis } from '@/hooks/use-ai';

interface AiAnalysisCardProps {
  kind: AnalysisKind;
  attemptId: string;
  /** Lets study-plan items link to practice in the same specialty. */
  specialtyId?: string;
  /** Shown instead of the button when analysis is not allowed yet (e.g. a competition still running). */
  blockedReason?: string;
}

/** AI tutor feedback for one finished attempt; hidden entirely when the server has no AI configured. */
export function AiAnalysisCard({ kind, attemptId, specialtyId, blockedReason }: AiAnalysisCardProps) {
  const t = useTranslations('ai');
  const locale = useLocale() as Locale;
  const { data: status } = useAiStatus();
  const { data: analysis, isLoading } = useAnalysis(kind, attemptId, locale, Boolean(status?.enabled) && !blockedReason);
  const generate = useGenerateAnalysis(kind, attemptId, locale);

  if (!status?.enabled) return null;

  const remaining = Math.max(0, status.dailyLimit - status.usedToday);

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {blockedReason ? (
          <p className="text-sm text-muted-foreground">{blockedReason}</p>
        ) : analysis ? (
          <AnalysisBody analysis={analysis} specialtyId={specialtyId} />
        ) : generate.isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" />
            {t('generating')}
          </p>
        ) : isLoading ? null : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t('intro')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => generate.mutate()} disabled={remaining === 0}>
                <Sparkles className="size-4" />
                {t('generate')}
              </Button>
              <span className="text-xs text-muted-foreground">{t('remaining', { remaining, limit: status.dailyLimit })}</span>
            </div>
          </div>
        )}

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {t('disclaimer')}
        </p>
      </CardContent>
    </Card>
  );
}

function AnalysisBody({ analysis, specialtyId }: { analysis: AttemptAnalysisOutput; specialtyId?: string }) {
  const t = useTranslations('ai');

  return (
    <div className="flex flex-col gap-5">
      {analysis.summary && <p>{analysis.summary}</p>}

      {analysis.mistakes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('mistakesTitle')}</h3>
          {analysis.mistakes.map((mistake) => (
            <div key={mistake.questionNumber} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">
                {t('question', { number: mistake.questionNumber })} · {mistake.keyConcept}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{mistake.explanation}</p>
            </div>
          ))}
          {!analysis.revealsCorrectAnswers && <p className="text-xs text-muted-foreground">{t('noAnswersNote')}</p>}
        </section>
      )}

      {analysis.studyPlan.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('studyPlanTitle')}</h3>
          <ol className="flex flex-col gap-3">
            {analysis.studyPlan.map((item, index) => (
              <li key={index} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {index + 1}. {item.topic}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                  {specialtyId && (
                    <Link
                      href={{ pathname: '/practice', query: { specialtyId, ...(item.topicId ? { topicId: item.topicId } : {}) } }}
                      className="shrink-0"
                    >
                      <Button size="sm" variant="outline">
                        <Dumbbell className="size-4" />
                        {t('practice')}
                      </Button>
                    </Link>
                  )}
                </div>
                {item.tips.length > 0 && (
                  <ul className="mt-2 list-disc ps-5 text-sm text-muted-foreground">
                    {item.tips.map((tip, tipIndex) => (
                      <li key={tipIndex}>{tip}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {analysis.encouragement && <p className="text-sm font-medium text-primary">{analysis.encouragement}</p>}
    </div>
  );
}
