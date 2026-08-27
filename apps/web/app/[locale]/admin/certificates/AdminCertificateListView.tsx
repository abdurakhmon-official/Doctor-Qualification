'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Link } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { LEVEL_BADGE_VARIANT } from '@/lib/utils';
import { useAdminCertificates, useRevokeCertificate } from '@/hooks/use-certificates';

export function AdminCertificateListView() {
  const t = useTranslations('admin.certificates');
  const tLevel = useTranslations('attempts.result.level');
  const locale = useLocale() as Locale;
  const [page, setPage] = useState(1);

  const { data } = useAdminCertificates({ page });
  const revokeCertificate = useRevokeCertificate();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {!data?.data.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((certificate) => (
            <div
              key={certificate.certificateId}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{certificate.userFullName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {pickLocalized(certificate.specialtyName, locale)} · {certificate.certificateId}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{certificate.score}%</span>
                <Badge variant={LEVEL_BADGE_VARIANT[certificate.level]}>{tLevel(certificate.level)}</Badge>
                {certificate.revoked && <Badge variant="danger">{t('revoked')}</Badge>}
                <Link href={{ pathname: '/certificates/[certificateId]', params: { certificateId: certificate.certificateId } }}>
                  <Button size="sm" variant="outline">
                    {t('view')}
                  </Button>
                </Link>
                {!certificate.revoked && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={revokeCertificate.isPending}
                    onClick={() => revokeCertificate.mutate(certificate.certificateId)}
                  >
                    {t('revoke')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={page} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />}
    </div>
  );
}
