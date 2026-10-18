import { setRequestLocale } from 'next-intl/server';
import { CompetitionDetailView } from './CompetitionDetailView';

export default async function CompetitionPage({ params }: PageProps<'/[locale]/competitions/[competitionId]'>) {
  const { locale, competitionId } = await params;
  setRequestLocale(locale);

  return <CompetitionDetailView competitionId={competitionId} />;
}
