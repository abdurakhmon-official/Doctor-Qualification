'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminAuditLogQuery } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { auditService } from '@/lib/services';

export const useAdminAuditLogs = (query: Partial<AdminAuditLogQuery>) => {
  return useQuery({
    queryKey: queryKeys.adminAuditLogs(query),
    queryFn: () => auditService.list(query),
  });
};
