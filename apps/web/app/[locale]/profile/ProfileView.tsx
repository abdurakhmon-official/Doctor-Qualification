'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { UpdateProfileInputSchema, type UpdateProfileInput } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { errorFrom } from '@/lib/errors';
import { assetUrl, cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-auth';
import { useUpdateProfile } from '@/hooks/use-user';
import { useUpload } from '@/hooks/use-upload';

export function ProfileView() {
  const t = useTranslations('profile');
  const { user } = useSession();
  const updateProfile = useUpdateProfile();
  const upload = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileInputSchema),
    values: user ? { fullName: user.fullName, phone: user.phone, avatar: user.avatar } : undefined,
  });

  const avatar = watch('avatar');

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await upload.mutateAsync({ folder: 'avatar', file });
    setValue('avatar', result.key, { shouldDirty: true });
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile.mutateAsync(data);
    } catch (error) {
      const detail = errorFrom(error);
      setError('root', { message: detail.message });
    }
  });

  if (!user) return null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative size-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(avatar)} alt="" className="size-full object-cover" />
                ) : (
                  <span className={cn('flex size-full items-center justify-center text-lg font-semibold text-muted-foreground')}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              <div className="flex flex-col gap-1">
                <Button type="button" variant="outline" size="sm" disabled={upload.isPending} onClick={() => fileInputRef.current?.click()}>
                  {upload.isPending ? t('avatar.uploading') : t('avatar.change')}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
              </div>
            </div>

            <FormField label={t('fields.fullName')} htmlFor="fullName" error={errors.fullName?.message}>
              <Input id="fullName" autoComplete="name" {...register('fullName')} />
            </FormField>

            <FormField label={t('fields.email')} htmlFor="email">
              <Input id="email" value={user.email} disabled readOnly />
            </FormField>
            <p className="-mt-2 text-xs text-muted-foreground">{t('emailNote')}</p>

            <FormField label={t('fields.phone')} htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
            </FormField>

            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

            <Button type="submit" disabled={updateProfile.isPending} className="mt-2">
              {updateProfile.isPending ? t('saving') : t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
