import { setRequestLocale } from 'next-intl/server';
import { CertificateTemplateSettingsView } from './CertificateTemplateSettingsView';

export default async function AdminCertificateTemplatePage({ params }: PageProps<'/[locale]/admin/certificate-template'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CertificateTemplateSettingsView />;
}
