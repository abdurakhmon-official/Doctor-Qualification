import { setRequestLocale } from 'next-intl/server';
import { ExamListView } from './ExamListView';

export default async function ExamsPage({ params }: PageProps<'/[locale]/exams'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ExamListView />;
}
