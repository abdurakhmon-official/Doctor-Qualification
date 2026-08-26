'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateSpecialtyInputSchema, type CreateSpecialtyInput, type SpecialtyOutput } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { LocalizedFields } from '@/components/admin/LocalizedFields';
import { pickLocalized } from '@/lib/localized';
import { useAdminSpecialties, useCreateSpecialty, useUpdateSpecialty } from '@/hooks/use-specialties';
import type { Locale } from '@repo/contracts';

export function AdminSpecialtyListView() {
  const t = useTranslations('admin.specialties');
  const locale = useLocale() as Locale;
  const { data: specialties } = useAdminSpecialties();
  const [adding, setAdding] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<SpecialtyOutput | null>(null);
  const updateSpecialty = useUpdateSpecialty();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setAdding(true)}>
          {t('add')}
        </Button>
      </div>

      {!specialties?.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((specialty) => (
            <Card key={specialty.id}>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{pickLocalized(specialty.name, locale)}</p>
                  <Badge variant={specialty.isActive ? 'success' : 'danger'}>
                    {specialty.isActive ? t('active') : t('inactive')}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingSpecialty(specialty)}>
                    {t('edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateSpecialty.isPending}
                    onClick={() => updateSpecialty.mutate({ specialtyId: specialty.id, input: { isActive: !specialty.isActive } })}
                  >
                    {specialty.isActive ? t('deactivate') : t('activate')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={t('add')}>
        <SpecialtyForm onDone={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editingSpecialty} onClose={() => setEditingSpecialty(null)} title={t('edit')}>
        {editingSpecialty && <SpecialtyForm specialty={editingSpecialty} onDone={() => setEditingSpecialty(null)} />}
      </Modal>
    </div>
  );
}

function SpecialtyForm({ specialty, onDone }: { specialty?: SpecialtyOutput; onDone: () => void }) {
  const t = useTranslations('admin.specialties');
  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const isPending = createSpecialty.isPending || updateSpecialty.isPending;

  const { register, handleSubmit } = useForm<CreateSpecialtyInput>({
    resolver: zodResolver(CreateSpecialtyInputSchema),
    defaultValues: specialty ? { name: specialty.name } : undefined,
  });

  const onSubmit = handleSubmit(async (data) => {
    if (specialty) {
      await updateSpecialty.mutateAsync({ specialtyId: specialty.id, input: data });
    } else {
      await createSpecialty.mutateAsync(data);
    }

    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <LocalizedFields name="name" label={t('name')} register={register} />

      <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t('cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
