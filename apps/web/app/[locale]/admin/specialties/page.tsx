import { setRequestLocale } from 'next-intl/server';
import { AdminSpecialtyListView } from './AdminSpecialtyListView';

export default async function AdminSpecialtiesPage({ params }: PageProps<'/[locale]/admin/specialties'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminSpecialtyListView />;
}
