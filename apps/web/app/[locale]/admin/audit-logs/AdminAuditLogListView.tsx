'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminAuditLogs } from '@/hooks/use-audit-logs';

export function AdminAuditLogListView() {
  const t = useTranslations('admin.auditLogs');
  const [page, setPage] = useState(1);

  const { data } = useAdminAuditLogs({ page });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {!data?.data.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((log) => (
            <details key={log.id} className="rounded-xl border border-border bg-card p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{log.action}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {log.actorEmail} · {log.entityType}
                    {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t('before')}</p>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-2 text-xs">{JSON.stringify(log.before, null, 2) ?? '—'}</pre>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t('after')}</p>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-2 text-xs">{JSON.stringify(log.after, null, 2) ?? '—'}</pre>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {data && <Pagination page={page} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />}
    </div>
  );
}
