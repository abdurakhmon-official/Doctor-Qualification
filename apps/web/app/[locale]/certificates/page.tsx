import { setRequestLocale } from 'next-intl/server';
import { CertificateListView } from './CertificateListView';

export default async function CertificatesPage({ params }: PageProps<'/[locale]/certificates'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CertificateListView />;
}
