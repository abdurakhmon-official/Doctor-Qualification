import { setRequestLocale } from 'next-intl/server';
import { ExamEditView } from './ExamEditView';

export default async function ExamEditPage({ params }: PageProps<'/[locale]/admin/exams/[examId]'>) {
  const { locale, examId } = await params;
  setRequestLocale(locale);

  return <ExamEditView examId={examId} />;
}
