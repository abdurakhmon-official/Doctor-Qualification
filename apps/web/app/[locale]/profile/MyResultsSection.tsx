'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { LEVEL_BADGE_VARIANT } from '@/lib/utils';
import { useMyAttempts } from '@/hooks/use-exam-attempts';

export function MyResultsSection() {
  const t = useTranslations('profile.results');
  const tLevel = useTranslations('attempts.result.level');
  const locale = useLocale() as Locale;
  const { data: attempts } = useMyAttempts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!attempts?.length ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {attempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={{ pathname: '/attempts/[attemptId]', params: { attemptId: attempt.id } }}
                className="flex flex-col gap-2 rounded-xl border border-border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{pickLocalized(attempt.examTitle, locale)}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {pickLocalized(attempt.specialtyName, locale)} · {new Date(attempt.submittedAt).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">{attempt.score}%</span>
                  <Badge variant={LEVEL_BADGE_VARIANT[attempt.level]}>{tLevel(attempt.level)}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
