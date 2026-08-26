'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StartAttemptInput, SubmitAttemptInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { examAttemptService, examService } from '@/lib/services';

export const usePublishedExams = (specialtyId?: string) => {
  return useQuery({
    queryKey: queryKeys.publishedExams(specialtyId),
    queryFn: () => examService.listPublished(specialtyId),
  });
};

export const useStartAttempt = () => {
  return useMutation({
    mutationFn: (input: StartAttemptInput) => examAttemptService.start(input),
  });
};

export const useSubmitAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, input }: { attemptId: string; input: SubmitAttemptInput }) => examAttemptService.submit(attemptId, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myAttemptsBase });
      queryClient.invalidateQueries({ queryKey: queryKeys.attempt(variables.attemptId) });
    },
  });
};

export const useMyAttempts = () => {
  return useQuery({
    queryKey: queryKeys.myAttemptsBase,
    queryFn: () => examAttemptService.myAttempts(),
  });
};

export const useAttempt = (attemptId: string) => {
  return useQuery({
    queryKey: queryKeys.attempt(attemptId),
    queryFn: () => examAttemptService.get(attemptId),
  });
};
