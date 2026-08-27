'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { UpdateRatingSettingsInput } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useRatingSettings, useUpdateRatingSettings } from '@/hooks/use-ratings';

const WEIGHT_FIELDS = ['avgScoreWeight', 'bestScoreWeight', 'consistencyWeight', 'attemptCountWeight'] as const;

export function RatingSettingsView() {
  const t = useTranslations('admin.ratingSettings');
  const { data: settings } = useRatingSettings();
  const updateSettings = useUpdateRatingSettings();
  const [form, setForm] = useState<UpdateRatingSettingsInput | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (!form) return null;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateSettings.mutate(form);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {WEIGHT_FIELDS.map((field) => (
              <FormField key={field} label={`${t(field)} — ${Math.round(form[field] * 100)}%`} htmlFor={field}>
                <input
                  id={field}
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={form[field]}
                  onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })}
                  className="w-full accent-primary"
                />
              </FormField>
            ))}

            <FormField label={t('minAttemptsRequired')} htmlFor="minAttemptsRequired">
              <Input
                id="minAttemptsRequired"
                type="number"
                min={1}
                max={100}
                value={form.minAttemptsRequired}
                onChange={(event) => setForm({ ...form, minAttemptsRequired: Number(event.target.value) })}
              />
            </FormField>

            <Button type="submit" disabled={updateSettings.isPending} className="self-start">
              {t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
