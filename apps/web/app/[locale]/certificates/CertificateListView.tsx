'use client';

import { Award } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { LEVEL_BADGE_VARIANT } from '@/lib/utils';
import { useMyCertificates } from '@/hooks/use-certificates';

export function CertificateListView() {
  const t = useTranslations('certificates');
  const tLevel = useTranslations('attempts.result.level');
  const locale = useLocale() as Locale;
  const { data: certificates } = useMyCertificates();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {!certificates?.length ? (
        <EmptyState icon={Award} title={t('empty')} />
      ) : (
        <div className="flex flex-col gap-3">
          {certificates.map((certificate) => (
            <Link
              key={certificate.certificateId}
              href={{ pathname: '/certificates/[certificateId]', params: { certificateId: certificate.certificateId } }}
            >
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{pickLocalized(certificate.specialtyName, locale)}</p>
                    <p className="truncate text-sm text-muted-foreground font-mono">{certificate.certificateId}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">{certificate.score}%</span>
                    <Badge variant={LEVEL_BADGE_VARIANT[certificate.level]}>{tLevel(certificate.level)}</Badge>
                    {certificate.revoked && <Badge variant="danger">{t('revoked')}</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
