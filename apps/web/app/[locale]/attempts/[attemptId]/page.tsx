import { setRequestLocale } from 'next-intl/server';
import { AttemptView } from './AttemptView';

export default async function AttemptPage({ params }: PageProps<'/[locale]/attempts/[attemptId]'>) {
  const { locale, attemptId } = await params;
  setRequestLocale(locale);

  return <AttemptView attemptId={attemptId} />;
}
