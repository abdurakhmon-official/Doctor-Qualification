'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { COMPETITION_MAX_QUESTIONS, COMPETITION_MIN_QUESTIONS, LocalizedTextSchema, type Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { LocalizedFields } from '@/components/admin/LocalizedFields';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { useAdminCompetitions, useCreateCompetition, useDeleteCompetition } from '@/hooks/use-competitions';
import { useSpecialties } from '@/hooks/use-specialties';

// <input type="datetime-local"> works in the admin's local time without a zone suffix
const toLocalInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const FormSchema = z
  .object({
    specialtyId: z.string().uuid(),
    title: LocalizedTextSchema,
    questionCount: z.coerce.number().int().min(COMPETITION_MIN_QUESTIONS).max(COMPETITION_MAX_QUESTIONS),
    durationMinutes: z.coerce.number().int().min(1).max(180),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
  })
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), { message: 'endsAfterStart', path: ['endsAt'] });

type FormValues = z.input<typeof FormSchema>;

export function AdminCompetitionListView() {
  const t = useTranslations('admin.competitions');
  const tStatus = useTranslations('competitions.status');
  const locale = useLocale() as Locale;
  const { data: competitions } = useAdminCompetitions();
  const deleteCompetition = useDeleteCompetition();
  const [adding, setAdding] = useState(false);
  const format = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setAdding(true)}>
          {t('add')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t('description')}</p>

      {!competitions?.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {competitions.map((competition) => (
            <div
              key={competition.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{pickLocalized(competition.title, locale)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {pickLocalized(competition.specialtyName, locale)} · {format(competition.startsAt)} — {format(competition.endsAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('stats', { questions: competition.questionCount, minutes: competition.durationMinutes, participants: competition.participantCount })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {competition.isWeekly && <Badge>{t('weekly')}</Badge>}
                <Badge variant={competition.status === 'ACTIVE' ? 'success' : competition.status === 'UPCOMING' ? 'warning' : 'default'}>
                  {tStatus(competition.status)}
                </Badge>
                <Link href={{ pathname: '/competitions/[competitionId]', params: { competitionId: competition.id } }}>
                  <Button size="sm" variant="outline">
                    {t('open')}
                  </Button>
                </Link>
                {competition.participantCount === 0 && (
                  <Button size="sm" variant="outline" disabled={deleteCompetition.isPending} onClick={() => deleteCompetition.mutate(competition.id)}>
                    {t('delete')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={t('add')}>
        <CompetitionForm onDone={() => setAdding(false)} />
      </Modal>
    </div>
  );
}

function CompetitionForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('admin.competitions');
  const locale = useLocale() as Locale;
  const { data: specialties } = useSpecialties();
  const createCompetition = useCreateCompetition();
  const now = new Date();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      specialtyId: '',
      questionCount: 10,
      durationMinutes: 15,
      startsAt: toLocalInput(now),
      endsAt: toLocalInput(new Date(now.getTime() + 7 * 24 * 60 * 60_000)),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createCompetition.mutateAsync({
        specialtyId: values.specialtyId,
        title: values.title,
        questionCount: Number(values.questionCount),
        durationMinutes: Number(values.durationMinutes),
        startsAt: new Date(values.startsAt),
        endsAt: new Date(values.endsAt),
      });
      onDone();
    } catch {
      // the axios interceptor shows the server message (e.g. not enough questions)
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField label={t('fields.specialty')} htmlFor="competition-specialty" error={errors.specialtyId ? t('fields.specialtyRequired') : undefined}>
        <Select id="competition-specialty" {...register('specialtyId')}>
          <option value="">{t('fields.chooseSpecialty')}</option>
          {specialties?.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {pickLocalized(specialty.name, locale)}
            </option>
          ))}
        </Select>
      </FormField>

      <LocalizedFields name="title" label={t('fields.title')} register={register} />
      {errors.title && <p className="-mt-2 text-sm text-destructive">{t('fields.titleRequired')}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('fields.questionCount')} htmlFor="competition-count" error={errors.questionCount ? t('fields.countRange', { min: COMPETITION_MIN_QUESTIONS, max: COMPETITION_MAX_QUESTIONS }) : undefined}>
          <Input id="competition-count" type="number" min={COMPETITION_MIN_QUESTIONS} max={COMPETITION_MAX_QUESTIONS} {...register('questionCount')} />
        </FormField>
        <FormField label={t('fields.durationMinutes')} htmlFor="competition-duration" error={errors.durationMinutes ? t('fields.durationRange') : undefined}>
          <Input id="competition-duration" type="number" min={1} max={180} {...register('durationMinutes')} />
        </FormField>
        <FormField label={t('fields.startsAt')} htmlFor="competition-starts">
          <Input id="competition-starts" type="datetime-local" {...register('startsAt')} />
        </FormField>
        <FormField label={t('fields.endsAt')} htmlFor="competition-ends" error={errors.endsAt ? t('fields.endsAfterStart') : undefined}>
          <Input id="competition-ends" type="datetime-local" {...register('endsAt')} />
        </FormField>
      </div>

      <p className="text-xs text-muted-foreground">{t('fields.questionsHint')}</p>

      <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t('cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={createCompetition.isPending}>
          {createCompetition.isPending ? t('saving') : t('create')}
        </Button>
      </div>
    </form>
  );
}
