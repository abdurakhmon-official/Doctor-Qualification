import { setRequestLocale } from 'next-intl/server';
import { CertificateDetailView } from './CertificateDetailView';

export default async function CertificateDetailPage({ params }: PageProps<'/[locale]/certificates/[certificateId]'>) {
  const { locale, certificateId } = await params;
  setRequestLocale(locale);

  return <CertificateDetailView certificateId={certificateId} />;
}
