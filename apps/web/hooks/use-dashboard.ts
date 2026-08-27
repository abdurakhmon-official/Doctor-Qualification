'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { dashboardService } from '@/lib/services';

export const usePublicStats = () => {
  return useQuery({
    queryKey: queryKeys.publicStats,
    queryFn: () => dashboardService.publicStats(),
  });
};

export const useMyDashboard = () => {
  return useQuery({
    queryKey: queryKeys.myDashboard,
    queryFn: () => dashboardService.myDashboard(),
  });
};

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => dashboardService.adminDashboard(),
  });
};
