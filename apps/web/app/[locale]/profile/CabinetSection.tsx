'use client';

import { BookOpenCheck, Dumbbell, Flame, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/ui/StatCard';
import { useMyProgress } from '@/hooks/use-dashboard';
import { BadgesSection } from './BadgesSection';
import { ProgressChart } from './ProgressChart';
import { TopicStrengthsSection } from './TopicStrengthsSection';

/** Learning progress across exams and practice: totals, streak, score trend and per-topic accuracy. */
export function CabinetSection() {
  const t = useTranslations('profile.cabinet');
  const { data } = useMyProgress();

  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Star} label={t('points')} value={data.points} accent="warning" />
        <StatCard icon={BookOpenCheck} label={t('topicsStudied')} value={data.topicsStudied} accent="primary" />
        <StatCard
          icon={Flame}
          label={data.activeToday || data.streakDays === 0 ? t('streak') : t('streakKeepGoing')}
          value={t('days', { count: data.streakDays })}
          accent={data.activeToday ? 'success' : 'warning'}
        />
        <StatCard icon={Dumbbell} label={t('practiceCount')} value={data.practiceCount} accent="primary" />
      </div>

      <BadgesSection />
      <ProgressChart timeline={data.timeline} />
      <TopicStrengthsSection topics={data.topics} />
    </>
  );
}
