import { setRequestLocale } from 'next-intl/server';
import { AdminCertificateListView } from './AdminCertificateListView';

export default async function AdminCertificatesPage({ params }: PageProps<'/[locale]/admin/certificates'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminCertificateListView />;
}
