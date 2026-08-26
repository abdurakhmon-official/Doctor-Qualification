import { setRequestLocale } from 'next-intl/server';
import { ExamInfoView } from './ExamInfoView';

export default async function ExamInfoPage({ params }: PageProps<'/[locale]/exams/[examId]'>) {
  const { locale, examId } = await params;
  setRequestLocale(locale);

  return <ExamInfoView examId={examId} />;
}
