import { setRequestLocale } from 'next-intl/server';
import { AdminExamListView } from './AdminExamListView';

export default async function AdminExamsPage({ params }: PageProps<'/[locale]/admin/exams'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminExamListView />;
}
