import { setRequestLocale } from 'next-intl/server';
import { PracticeSetupView } from './PracticeSetupView';

const single = (value: string | string[] | undefined) => (typeof value === 'string' ? value : undefined);

export default async function PracticePage({ params, searchParams }: PageProps<'/[locale]/practice'>) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  // `?specialtyId=…&topicId=…` comes from the cabinet's "practice this topic" links
  return <PracticeSetupView initialSpecialtyId={single(query.specialtyId)} initialTopicId={single(query.topicId)} />;
}
