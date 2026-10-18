import { setRequestLocale } from 'next-intl/server';
import { CompetitionListView } from './CompetitionListView';

export default async function CompetitionsPage({ params }: PageProps<'/[locale]/competitions'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CompetitionListView />;
}
