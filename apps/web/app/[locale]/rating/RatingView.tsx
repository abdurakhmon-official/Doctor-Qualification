'use client';

import { Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Locale, RatingPeriod } from '@repo/contracts';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { RankBadge } from '@/components/ui/RankBadge';
import { Select } from '@/components/ui/Select';
import { pickLocalized } from '@/lib/localized';
import { useSession } from '@/hooks/use-auth';
import { useSpecialties } from '@/hooks/use-specialties';
import { useMyRating, useRatings } from '@/hooks/use-ratings';
import { MyRatingCard } from './MyRatingCard';

export function RatingView() {
  const t = useTranslations('rating');
  const locale = useLocale() as Locale;
  const { isAuthenticated, user } = useSession();

  const { data: specialties } = useSpecialties();
  const [specialtyId, setSpecialtyId] = useState('');
  const [period, setPeriod] = useState<RatingPeriod>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const firstSpecialtyId = specialties?.[0]?.id;
    if (!specialtyId && firstSpecialtyId) setSpecialtyId(firstSpecialtyId);
  }, [specialties, specialtyId]);

  const { data } = useRatings({ specialtyId: specialtyId || undefined, period, page });
  const { data: myRating } = useMyRating(isAuthenticated && user?.role === 'USER' ? specialtyId : undefined);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="flex flex-wrap gap-3">
        <Select
          value={specialtyId}
          onChange={(event) => {
            setSpecialtyId(event.target.value);
            setPage(1);
          }}
          className="max-w-52"
        >
          {specialties?.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {pickLocalized(specialty.name, locale)}
            </option>
          ))}
        </Select>

        <Select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as RatingPeriod);
            setPage(1);
          }}
          className="max-w-36"
        >
          <option value="all">{t('period.all')}</option>
          <option value="week">{t('period.week')}</option>
          <option value="month">{t('period.month')}</option>
        </Select>
      </div>

      {myRating && <MyRatingCard rating={myRating} />}

      {!data?.data.length ? (
        <EmptyState icon={Trophy} title={t('empty')} />
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((entry) => (
            <Card key={entry.userId}>
              <CardContent className="flex items-center gap-4 py-3">
                <RankBadge rank={entry.rank} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {t('attemptCount')}: {entry.attemptCount} · {t('avgScore')}: {entry.avgScore}%
                  </p>
                </div>
                <span className="text-lg font-bold text-primary">{entry.compositeScore}%</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && <Pagination page={page} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />}
    </div>
  );
}
