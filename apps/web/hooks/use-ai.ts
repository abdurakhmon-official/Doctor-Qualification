'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalysisKind, Locale } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { aiService } from '@/lib/services';

export const useAiStatus = () => {
  return useQuery({
    queryKey: queryKeys.aiStatus,
    queryFn: () => aiService.status(),
  });
};

export const useAnalysis = (kind: AnalysisKind, attemptId: string, locale: Locale, enabled: boolean) => {
  return useQuery({
    queryKey: queryKeys.aiAnalysis(kind, attemptId, locale),
    queryFn: () => aiService.analysis(kind, attemptId, locale),
    enabled,
  });
};

export const useGenerateAnalysis = (kind: AnalysisKind, attemptId: string, locale: Locale) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => aiService.generate(kind, attemptId, locale),
    onSuccess: (analysis) => {
      queryClient.setQueryData(queryKeys.aiAnalysis(kind, attemptId, locale), analysis);
      queryClient.invalidateQueries({ queryKey: queryKeys.aiStatus });
    },
  });
};
