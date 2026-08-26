import { setRequestLocale } from 'next-intl/server';
import { NewExamForm } from './NewExamForm';

export default async function NewExamPage({ params }: PageProps<'/[locale]/admin/exams/new'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewExamForm />;
}
