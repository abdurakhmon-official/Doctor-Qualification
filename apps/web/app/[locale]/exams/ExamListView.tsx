'use client';

import { BookOpen } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { useSpecialties } from '@/hooks/use-specialties';
import { usePublishedExams } from '@/hooks/use-exam-attempts';

const ICON_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
];

const DEFAULT_ICON_COLOR = ICON_COLORS[0] as string;

const colorForSpecialty = (specialtyId: string): string => {
  const hash = specialtyId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ICON_COLORS[hash % ICON_COLORS.length] ?? DEFAULT_ICON_COLOR;
};

export function ExamListView() {
  const t = useTranslations('exams');
  const locale = useLocale() as Locale;
  const { data: specialties } = useSpecialties();
  const [specialtyId, setSpecialtyId] = useState('');
  const { data: exams } = usePublishedExams(specialtyId || undefined);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Select value={specialtyId} onChange={(event) => setSpecialtyId(event.target.value)} className="max-w-52">
          <option value="">{t('allSpecialties')}</option>
          {specialties?.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {pickLocalized(specialty.name, locale)}
            </option>
          ))}
        </Select>
      </div>

      {!exams?.length ? (
        <EmptyState icon={BookOpen} title={t('empty')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="flex flex-col gap-3 py-5">
                <div className={`flex size-11 items-center justify-center rounded-xl ${colorForSpecialty(exam.specialtyId)}`}>
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{pickLocalized(exam.title, locale)}</p>
                  <p className="text-sm text-muted-foreground">{pickLocalized(exam.specialtyName, locale)}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <span>{t('questionCount', { count: exam.questionCount })}</span>
                  <span>{t('duration', { minutes: exam.durationMinutes })}</span>
                </div>
                <Link href={{ pathname: '/exams/[examId]', params: { examId: exam.id } }}>
                  <Button size="sm" className="w-full">
                    {t('start')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
