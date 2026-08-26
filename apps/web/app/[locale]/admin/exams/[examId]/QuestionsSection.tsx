'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale, QuestionOutput } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { pickLocalized } from '@/lib/localized';
import { useDeleteQuestion } from '@/hooks/use-questions';
import { QuestionForm } from './QuestionForm';

export function QuestionsSection({ examId, questions }: { examId: string; questions: QuestionOutput[] }) {
  const t = useTranslations('admin.exams.questions');
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding((value) => !value)}>
          {t('add')}
        </Button>
      </div>

      {adding && <QuestionForm examId={examId} onDone={() => setAdding(false)} />}

      {!questions.length && !adding ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((question, index) => (
            <QuestionRow key={question.id} examId={examId} question={question} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionRow({ examId, question, index }: { examId: string; question: QuestionOutput; index: number }) {
  const t = useTranslations('admin.exams.questions');
  const locale = useLocale() as Locale;
  const [editing, setEditing] = useState(false);
  const deleteQuestion = useDeleteQuestion(examId);

  if (editing) {
    return <QuestionForm examId={examId} question={question} onDone={() => setEditing(false)} />;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">
            {index + 1}. {pickLocalized(question.text, locale)}
          </p>
          <Badge>{t(`difficultyLevel.${question.difficulty}`)}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className={cn(
                'rounded-md border border-border px-3 py-1.5 text-sm',
                optionIndex === question.correctIndex &&
                  'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400',
              )}
            >
              {String.fromCharCode(65 + optionIndex)}) {pickLocalized(option, locale)}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            {t('edit')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => deleteQuestion.mutate(question.id)}>
            {t('delete')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
