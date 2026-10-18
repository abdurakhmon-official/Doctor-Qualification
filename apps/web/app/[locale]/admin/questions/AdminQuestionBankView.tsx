'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale, QuestionDifficulty } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { useAdminQuestions } from '@/hooks/use-questions';
import { useAdminSpecialties } from '@/hooks/use-specialties';
import { useAdminTopics } from '@/hooks/use-topics';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

export function AdminQuestionBankView() {
  const t = useTranslations('admin.questionBank');
  const tQuestion = useTranslations('admin.exams.questions');
  const locale = useLocale() as Locale;
  const { data: specialties } = useAdminSpecialties();
  const [specialtyId, setSpecialtyId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | ''>('');
  const [page, setPage] = useState(1);

  const { data: topics } = useAdminTopics(specialtyId, { enabled: Boolean(specialtyId) });
  const { data } = useAdminQuestions({
    specialtyId: specialtyId || undefined,
    topicId: topicId || undefined,
    difficulty: difficulty || undefined,
    page,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {data && <p className="text-sm text-muted-foreground">{t('total', { count: data.meta.total })}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={specialtyId}
          onChange={(event) => {
            setSpecialtyId(event.target.value);
            // topics belong to one specialty, so the topic filter can't survive a specialty change
            setTopicId('');
            setPage(1);
          }}
          className="max-w-56"
        >
          <option value="">{t('allSpecialties')}</option>
          {specialties?.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {pickLocalized(specialty.name, locale)}
            </option>
          ))}
        </Select>

        <Select
          value={topicId}
          disabled={!specialtyId}
          onChange={(event) => {
            setTopicId(event.target.value);
            setPage(1);
          }}
          className="max-w-56"
        >
          <option value="">{specialtyId ? t('allTopics') : t('pickSpecialtyFirst')}</option>
          <option value="none">{tQuestion('noTopic')}</option>
          {topics?.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {pickLocalized(topic.name, locale)}
            </option>
          ))}
        </Select>

        <Select
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value as QuestionDifficulty | '');
            setPage(1);
          }}
          className="max-w-44"
        >
          <option value="">{t('allDifficulties')}</option>
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {tQuestion(`difficultyLevel.${level}`)}
            </option>
          ))}
        </Select>
      </div>

      {!data?.data.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((question) => (
            <div key={question.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <p className="font-medium">{pickLocalized(question.text, locale)}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge>{pickLocalized(question.specialtyName, locale)}</Badge>
                <Badge variant={question.topicName ? 'default' : 'warning'}>
                  {question.topicName ? pickLocalized(question.topicName, locale) : tQuestion('noTopic')}
                </Badge>
                <Badge>{tQuestion(`difficultyLevel.${question.difficulty}`)}</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span className="truncate">
                  {t('exam')}: {pickLocalized(question.examTitle, locale)}
                </span>
                <Link href={{ pathname: '/admin/exams/[examId]', params: { examId: question.examId } }}>
                  <Button size="sm" variant="outline">
                    {t('openExam')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={page} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />}
    </div>
  );
}
