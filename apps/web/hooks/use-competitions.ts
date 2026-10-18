'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCompetitionInput, SubmitCompetitionEntryInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { competitionService } from '@/lib/services';

// the table of a running contest changes as others finish
const LIVE_REFRESH_MS = 30_000;

export const useCompetitions = () => {
  return useQuery({
    queryKey: queryKeys.competitions,
    queryFn: () => competitionService.list(),
  });
};

export const useCompetition = (competitionId: string) => {
  return useQuery({
    queryKey: queryKeys.competition(competitionId),
    queryFn: () => competitionService.get(competitionId),
    refetchInterval: (query) => (query.state.data?.status === 'ACTIVE' ? LIVE_REFRESH_MS : false),
  });
};

export const useCompetitionEntry = (competitionId: string, enabled: boolean) => {
  return useQuery({
    queryKey: queryKeys.competitionEntry(competitionId),
    queryFn: () => competitionService.myEntry(competitionId),
    enabled,
  });
};

export const useMyBadges = () => {
  return useQuery({
    queryKey: queryKeys.myBadges,
    queryFn: () => competitionService.myBadges(),
  });
};

const useInvalidateCompetition = () => {
  const queryClient = useQueryClient();

  return (competitionId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.competition(competitionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.competitions });
    queryClient.invalidateQueries({ queryKey: queryKeys.myBadges });
  };
};

export const useStartCompetitionEntry = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCompetition();

  return useMutation({
    mutationFn: (competitionId: string) => competitionService.startEntry(competitionId),
    onSuccess: (entry) => {
      queryClient.setQueryData(queryKeys.competitionEntry(entry.competitionId), entry);
      invalidate(entry.competitionId);
    },
  });
};

export const useSubmitCompetitionEntry = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCompetition();

  return useMutation({
    mutationFn: ({ competitionId, input }: { competitionId: string; input: SubmitCompetitionEntryInput }) =>
      competitionService.submitEntry(competitionId, input),
    onSuccess: (entry) => {
      queryClient.setQueryData(queryKeys.competitionEntry(entry.competitionId), entry);
      invalidate(entry.competitionId);
    },
  });
};

export const useAdminCompetitions = () => {
  return useQuery({
    queryKey: queryKeys.adminCompetitions,
    queryFn: () => competitionService.adminList(),
  });
};

export const useCreateCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCompetitionInput) => competitionService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCompetitions });
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions });
    },
  });
};

export const useDeleteCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competitionId: string) => competitionService.delete(competitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCompetitions });
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions });
    },
  });
};
