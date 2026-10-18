import { setRequestLocale } from 'next-intl/server';
import { PracticeAttemptView } from './PracticeAttemptView';

export default async function PracticeAttemptPage({ params }: PageProps<'/[locale]/practice/[attemptId]'>) {
  const { locale, attemptId } = await params;
  setRequestLocale(locale);

  return <PracticeAttemptView attemptId={attemptId} />;
}
