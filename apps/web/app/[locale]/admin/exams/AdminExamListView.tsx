'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ExamStatus, Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { useSpecialties } from '@/hooks/use-specialties';
import { useAdminExams, useDeleteExam } from '@/hooks/use-exams';

export function AdminExamListView() {
  const t = useTranslations('admin.exams');
  const locale = useLocale() as Locale;
  const { data: specialties } = useSpecialties();
  const [specialtyId, setSpecialtyId] = useState('');
  const [status, setStatus] = useState<ExamStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data } = useAdminExams({ specialtyId: specialtyId || undefined, status: status || undefined, page });
  const deleteExam = useDeleteExam();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href="/admin/exams/new">
          <Button size="sm">{t('add')}</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={specialtyId}
          onChange={(event) => {
            setSpecialtyId(event.target.value);
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
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExamStatus | '');
            setPage(1);
          }}
          className="max-w-44"
        >
          <option value="">{t('allStatuses')}</option>
          <option value="DRAFT">{t('status.DRAFT')}</option>
          <option value="PUBLISHED">{t('status.PUBLISHED')}</option>
        </Select>
      </div>

      {!data?.data.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((exam) => (
            <div
              key={exam.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{pickLocalized(exam.title, locale)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {pickLocalized(exam.specialtyName, locale)} · {t('questionCount', { count: exam.questionCount })} ·{' '}
                  {t('duration', { minutes: exam.durationMinutes })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={exam.status === 'PUBLISHED' ? 'success' : 'warning'}>{t(`status.${exam.status}`)}</Badge>
                <Link href={{ pathname: '/admin/exams/[examId]', params: { examId: exam.id } }}>
                  <Button size="sm" variant="outline">
                    {t('edit')}
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => deleteExam.mutate(exam.id)}>
                  {t('delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={page} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />}
    </div>
  );
}
