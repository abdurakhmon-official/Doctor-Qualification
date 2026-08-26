import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t('title')}</h1>
      <p className="max-w-xl text-lg text-muted-foreground">{t('subtitle')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/sign-up">
          <Button size="lg">{t('getStarted')}</Button>
        </Link>
        <Link href="/sign-in">
          <Button size="lg" variant="outline">
            {t('signIn')}
          </Button>
        </Link>
      </div>
    </main>
  );
}
