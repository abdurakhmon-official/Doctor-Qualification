import { setRequestLocale } from 'next-intl/server';
import { AdminCompetitionListView } from './AdminCompetitionListView';

export default async function AdminCompetitionsPage({ params }: PageProps<'/[locale]/admin/competitions'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminCompetitionListView />;
}
