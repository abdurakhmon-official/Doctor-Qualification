'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { SigninInputSchema, type SigninInput } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { errorFrom } from '@/lib/errors';
import { useSignIn } from '@/hooks/use-auth';

export function SignInForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useSignIn();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SigninInput>({ resolver: zodResolver(SigninInputSchema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signIn.mutateAsync(data);
      router.push(searchParams.get('next') || '/');
    } catch (error) {
      const detail = errorFrom(error);
      setError('root', { message: detail.message });
    }
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('signIn.title')}</CardTitle>
        <CardDescription>{t('signIn.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField label={t('fields.email')} htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
          </FormField>

          <FormField label={t('fields.password')} htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          </FormField>

          {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

          <Button type="submit" disabled={signIn.isPending} className="mt-2">
            {signIn.isPending ? t('signIn.loading') : t('signIn.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
