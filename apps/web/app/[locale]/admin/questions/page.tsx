import { setRequestLocale } from 'next-intl/server';
import { AdminQuestionBankView } from './AdminQuestionBankView';

export default async function AdminQuestionsPage({ params }: PageProps<'/[locale]/admin/questions'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminQuestionBankView />;
}
