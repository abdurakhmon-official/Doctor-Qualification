import { setRequestLocale } from 'next-intl/server';
import { AdminDashboardView } from './AdminDashboardView';

export default async function AdminPage({ params }: PageProps<'/[locale]/admin'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminDashboardView />;
}
