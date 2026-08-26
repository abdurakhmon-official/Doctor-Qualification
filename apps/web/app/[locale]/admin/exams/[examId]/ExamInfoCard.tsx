'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { UpdateExamInputSchema, type AdminExamDetail, type Locale, type UpdateExamInput } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LocalizedFields } from '@/components/admin/LocalizedFields';
import { pickLocalized } from '@/lib/localized';
import { useSpecialties } from '@/hooks/use-specialties';
import { useUpdateExam } from '@/hooks/use-exams';

export function ExamInfoCard({ exam }: { exam: AdminExamDetail }) {
  const t = useTranslations('admin.exams');
  const tAuth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const { data: specialties } = useSpecialties();
  const updateExam = useUpdateExam();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateExamInput>({ resolver: zodResolver(UpdateExamInputSchema) });

  const specialtyId = watch('specialtyId');

  useEffect(() => {
    reset({
      title: exam.title,
      specialtyId: exam.specialtyId,
      description: exam.description ?? undefined,
      durationMinutes: exam.durationMinutes,
      minCertificateScore: exam.minCertificateScore,
    });
  }, [exam, reset]);

  const onSubmit = handleSubmit((data) => updateExam.mutateAsync({ examId: exam.id, input: data }));

  const togglePublish = () => {
    const nextStatus = exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updateExam.mutate({ examId: exam.id, input: { status: nextStatus } });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{pickLocalized(exam.title, locale)}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={exam.status === 'PUBLISHED' ? 'success' : 'warning'}>{t(`status.${exam.status}`)}</Badge>
          <Button size="sm" variant="outline" onClick={togglePublish} disabled={updateExam.isPending}>
            {exam.status === 'PUBLISHED' ? t('unpublish') : t('publish')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField label={t('fields.specialty')} htmlFor="specialtyId" error={errors.specialtyId?.message}>
            <Select id="specialtyId" value={specialtyId ?? ''} onChange={(event) => setValue('specialtyId', event.target.value)}>
              <option value="">{tAuth('fields.selectPlaceholder')}</option>
              {specialties?.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {pickLocalized(specialty.name, locale)}
                </option>
              ))}
            </Select>
          </FormField>

          <LocalizedFields name="title" label={t('fields.title')} register={register} />
          <LocalizedFields name="description" label={t('fields.description')} register={register} multiline />

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('fields.durationMinutes')} htmlFor="durationMinutes" error={errors.durationMinutes?.message}>
              <Input id="durationMinutes" type="number" min={1} max={300} {...register('durationMinutes')} />
            </FormField>

            <FormField label={t('fields.minCertificateScore')} htmlFor="minCertificateScore" error={errors.minCertificateScore?.message}>
              <Input id="minCertificateScore" type="number" min={0} max={100} {...register('minCertificateScore')} />
            </FormField>
          </div>

          <Button type="submit" size="sm" disabled={updateExam.isPending} className="self-start">
            {t('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
