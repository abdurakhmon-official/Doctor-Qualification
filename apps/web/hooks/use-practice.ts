'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PracticeAvailabilityQuery, StartPracticeInput, SubmitPracticeInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { practiceService } from '@/lib/services';

export const usePracticeAvailability = (query: PracticeAvailabilityQuery | null) => {
  return useQuery({
    queryKey: queryKeys.practiceAvailability(query ?? {}),
    queryFn: () => practiceService.availability(query as PracticeAvailabilityQuery),
    enabled: query !== null,
  });
};

export const useMyPractice = () => {
  return useQuery({
    queryKey: queryKeys.myPractice,
    queryFn: () => practiceService.my(),
  });
};

export const usePractice = (attemptId: string) => {
  return useQuery({
    queryKey: queryKeys.practice(attemptId),
    queryFn: () => practiceService.get(attemptId),
  });
};

export const useStartPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StartPracticeInput) => practiceService.start(input),
    onSuccess: (attempt) => {
      queryClient.setQueryData(queryKeys.practice(attempt.id), attempt);
      queryClient.invalidateQueries({ queryKey: queryKeys.myPractice });
    },
  });
};

export const useSubmitPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, input }: { attemptId: string; input: SubmitPracticeInput }) => practiceService.submit(attemptId, input),
    onSuccess: (attempt) => {
      // the submit response is the full result, so the page switches to it without a refetch
      queryClient.setQueryData(queryKeys.practice(attempt.id), attempt);
      queryClient.invalidateQueries({ queryKey: queryKeys.myPractice });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProgress });
      // AUTO levels depend on the latest scores
      queryClient.invalidateQueries({ queryKey: ['practice-availability'] });
    },
  });
};
