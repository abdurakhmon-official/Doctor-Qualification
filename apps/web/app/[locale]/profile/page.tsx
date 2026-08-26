import { setRequestLocale } from 'next-intl/server';
import { ProfileView } from './ProfileView';

export default async function ProfilePage({ params }: PageProps<'/[locale]/profile'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProfileView />;
}
