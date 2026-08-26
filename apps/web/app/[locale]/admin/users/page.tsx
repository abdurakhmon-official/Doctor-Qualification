import { setRequestLocale } from 'next-intl/server';
import { AdminUserListView } from './AdminUserListView';

export default async function AdminUsersPage({ params }: PageProps<'/[locale]/admin/users'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminUserListView />;
}
