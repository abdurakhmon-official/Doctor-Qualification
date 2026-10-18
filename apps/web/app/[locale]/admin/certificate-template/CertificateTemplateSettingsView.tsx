'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { UpdateCertificateTemplateInputSchema, type UpdateCertificateTemplateInput } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { LocalizedFields } from '@/components/admin/LocalizedFields';
import { useCertificateTemplate, useUpdateCertificateTemplate } from '@/hooks/use-certificates';

export function CertificateTemplateSettingsView() {
  const t = useTranslations('admin.certificateTemplate');
  const { data: template } = useCertificateTemplate();
  const updateTemplate = useUpdateCertificateTemplate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<UpdateCertificateTemplateInput>({ resolver: zodResolver(UpdateCertificateTemplateInputSchema) });

  const isAccredited = watch('isAccredited');

  const onAccreditedChange = (checked: boolean) => {
    setValue('isAccredited', checked);
    setValue('accreditationText', checked ? (template?.accreditationText ?? { uz: '', ru: '', en: '' }) : null);
  };

  useEffect(() => {
    if (template) reset(template);
  }, [template, reset]);

  const onSubmit = handleSubmit((data) => updateTemplate.mutateAsync(data));

  if (!template) return null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <LocalizedFields name="brand" label={t('fields.brand')} register={register} />
            <LocalizedFields name="title" label={t('fields.title')} register={register} />
            <LocalizedFields name="subtitle" label={t('fields.subtitle')} register={register} />
            <LocalizedFields name="bodyText" label={t('fields.bodyText')} register={register} multiline />

            <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <Switch id="isAccredited" checked={isAccredited ?? false} onChange={onAccreditedChange} label={t('fields.isAccredited')} />
              {isAccredited ? (
                <LocalizedFields name="accreditationText" label={t('fields.accreditationText')} register={register} multiline />
              ) : (
                <p className="text-xs text-muted-foreground">{t('accreditationHint')}</p>
              )}
            </div>

            <Button type="submit" disabled={updateTemplate.isPending} className="self-start">
              {t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
