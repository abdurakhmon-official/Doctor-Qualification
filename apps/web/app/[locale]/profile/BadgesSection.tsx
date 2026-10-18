'use client';

import { Medal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@repo/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { cn } from '@/lib/utils';
import { useMyBadges } from '@/hooks/use-competitions';

// decorative tints; the place is always spelled out next to the medal
const MEDAL_STYLES = {
  1: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  2: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  3: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
} as const;

/** Medals from finished competitions; hidden until the first one is earned. */
export function BadgesSection() {
  const t = useTranslations('profile.badges');
  const locale = useLocale() as Locale;
  const { data: badges } = useMyBadges();

  if (!badges?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <Link
            key={badge.competitionId}
            href={{ pathname: '/competitions/[competitionId]', params: { competitionId: badge.competitionId } }}
            className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
          >
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', MEDAL_STYLES[badge.rank])}>
              <Medal className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t(`place.${badge.rank}`)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {pickLocalized(badge.title, locale)} · {pickLocalized(badge.specialtyName, locale)}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(badge.endsAt).toLocaleDateString(locale)}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
