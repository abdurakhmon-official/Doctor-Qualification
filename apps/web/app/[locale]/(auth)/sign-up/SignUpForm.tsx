'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { SignupInputSchema, type SignupInput } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { errorFrom } from '@/lib/errors';
import { useSignUp } from '@/hooks/use-auth';

/** Forma to'ldirilmasdan oldingi shakl — `locale` hali default qo'yilmagan, ixtiyoriy. */
type SignUpFormValues = z.input<typeof SignupInputSchema>;

export function SignUpForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const signUp = useSignUp();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignupInputSchema),
    defaultValues: { locale: locale as SignupInput['locale'] },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      // `locale` — next-intl `useLocale()` doim `routing.locales` ichidan qaytaradi, shuning uchun xavfsiz.
      await signUp.mutateAsync({ ...data, locale: locale as SignupInput['locale'] });
      router.push('/');
    } catch (error) {
      const detail = errorFrom(error);
      setError('root', { message: detail.message });
    }
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('signUp.title')}</CardTitle>
        <CardDescription>{t('signUp.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField label={t('fields.fullName')} htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" autoComplete="name" {...register('fullName')} />
          </FormField>

          <FormField label={t('fields.email')} htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
          </FormField>

          <FormField label={t('fields.password')} htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          </FormField>

          {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

          <Button type="submit" disabled={signUp.isPending} className="mt-2">
            {signUp.isPending ? t('signUp.loading') : t('signUp.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
