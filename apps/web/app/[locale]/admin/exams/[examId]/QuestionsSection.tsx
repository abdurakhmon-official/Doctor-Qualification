'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale, QuestionOutput, TopicOutput } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { pickLocalized } from '@/lib/localized';
import { useDeleteQuestion } from '@/hooks/use-questions';
import { useAdminTopics } from '@/hooks/use-topics';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { QuestionForm } from './QuestionForm';

interface QuestionsSectionProps {
  examId: string;
  specialtyId: string;
  questions: QuestionOutput[];
}

export function QuestionsSection({ examId, specialtyId, questions }: QuestionsSectionProps) {
  const t = useTranslations('admin.exams.questions');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const { data: topics } = useAdminTopics(specialtyId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
            {t('importCsv')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdding((value) => !value)}>
            {t('add')}
          </Button>
        </div>
      </div>

      {adding && <QuestionForm examId={examId} specialtyId={specialtyId} onDone={() => setAdding(false)} />}

      {!questions.length && !adding ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((question, index) => (
            <QuestionRow
              key={question.id}
              examId={examId}
              specialtyId={specialtyId}
              question={question}
              index={index}
              topic={topics?.find((topic) => topic.id === question.topicId)}
            />
          ))}
        </div>
      )}

      <ImportQuestionsModal examId={examId} specialtyId={specialtyId} open={importing} onClose={() => setImporting(false)} />
    </div>
  );
}

interface QuestionRowProps {
  examId: string;
  specialtyId: string;
  question: QuestionOutput;
  index: number;
  topic?: TopicOutput;
}

function QuestionRow({ examId, specialtyId, question, index, topic }: QuestionRowProps) {
  const t = useTranslations('admin.exams.questions');
  const locale = useLocale() as Locale;
  const [editing, setEditing] = useState(false);
  const deleteQuestion = useDeleteQuestion(examId);

  if (editing) {
    return <QuestionForm examId={examId} specialtyId={specialtyId} question={question} onDone={() => setEditing(false)} />;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">
            {index + 1}. {pickLocalized(question.text, locale)}
          </p>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <Badge variant={topic ? 'default' : 'warning'}>{topic ? pickLocalized(topic.name, locale) : t('noTopic')}</Badge>
            <Badge>{t(`difficultyLevel.${question.difficulty}`)}</Badge>
          </div>
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
