import { setRequestLocale } from 'next-intl/server';
import { AdminAuditLogListView } from './AdminAuditLogListView';

export default async function AdminAuditLogsPage({ params }: PageProps<'/[locale]/admin/audit-logs'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminAuditLogListView />;
}
