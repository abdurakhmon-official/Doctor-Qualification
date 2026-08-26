'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { CreateExamInputSchema, type CreateExamInput, type Locale } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LocalizedFields } from '@/components/admin/LocalizedFields';
import { errorFrom } from '@/lib/errors';
import { pickLocalized } from '@/lib/localized';
import { useRouter } from '@/i18n/navigation';
import { useSpecialties } from '@/hooks/use-specialties';
import { useCreateExam } from '@/hooks/use-exams';

export function NewExamForm() {
  const t = useTranslations('admin.exams');
  const tAuth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { data: specialties } = useSpecialties();
  const createExam = useCreateExam();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateExamInput>({ resolver: zodResolver(CreateExamInputSchema), defaultValues: { minCertificateScore: 0 } });

  const specialtyId = watch('specialtyId');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const exam = await createExam.mutateAsync(data);
      router.push({ pathname: '/admin/exams/[examId]', params: { examId: exam.id } });
    } catch (error) {
      const detail = errorFrom(error);
      setError('root', { message: detail.message });
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('add')}</CardTitle>
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

            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

            <Button type="submit" disabled={createExam.isPending} className="mt-2 self-start">
              {t('create')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
