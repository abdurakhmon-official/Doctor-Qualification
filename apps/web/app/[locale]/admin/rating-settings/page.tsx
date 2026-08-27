import { setRequestLocale } from 'next-intl/server';
import { RatingSettingsView } from './RatingSettingsView';

export default async function RatingSettingsPage({ params }: PageProps<'/[locale]/admin/rating-settings'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RatingSettingsView />;
}
