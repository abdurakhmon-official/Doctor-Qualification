'use client';

import { Award, ClipboardCheck, TrendingUp, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/ui/StatCard';
import { useMyDashboard } from '@/hooks/use-dashboard';

export function MyStatsRow() {
  const t = useTranslations('profile.stats');
  const { data } = useMyDashboard();

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={ClipboardCheck} label={t('attemptCount')} value={data.attemptCount} accent="primary" />
      <StatCard icon={TrendingUp} label={t('avgScore')} value={`${data.avgScore}%`} accent="warning" />
      <StatCard icon={Trophy} label={t('bestScore')} value={`${data.bestScore}%`} accent="success" />
      <StatCard icon={Award} label={t('certificateCount')} value={data.certificateCount} accent="primary" />
    </div>
  );
}
