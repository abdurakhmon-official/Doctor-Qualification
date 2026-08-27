import { setRequestLocale } from 'next-intl/server';
import { RatingView } from './RatingView';

export default async function RatingPage({ params }: PageProps<'/[locale]/rating'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RatingView />;
}
