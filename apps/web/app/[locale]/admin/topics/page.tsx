import { setRequestLocale } from 'next-intl/server';
import { AdminTopicListView } from './AdminTopicListView';

export default async function AdminTopicsPage({ params }: PageProps<'/[locale]/admin/topics'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminTopicListView />;
}
