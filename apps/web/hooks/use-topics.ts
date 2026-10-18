'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTopicInput, UpdateTopicInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { topicService } from '@/lib/services';

export const useTopics = (specialtyId?: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: queryKeys.topics(specialtyId),
    queryFn: () => topicService.list(specialtyId),
    enabled: options.enabled ?? true,
  });
};

export const useAdminTopics = (specialtyId?: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: queryKeys.adminTopics(specialtyId),
    queryFn: () => topicService.adminList(specialtyId),
    enabled: options.enabled ?? true,
  });
};

const useInvalidateTopics = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminTopicsBase });
    queryClient.invalidateQueries({ queryKey: queryKeys.topicsBase });
  };
};

export const useCreateTopic = () => {
  const invalidate = useInvalidateTopics();

  return useMutation({
    mutationFn: (input: CreateTopicInput) => topicService.create(input),
    onSuccess: invalidate,
  });
};

export const useUpdateTopic = () => {
  const invalidate = useInvalidateTopics();

  return useMutation({
    mutationFn: ({ topicId, input }: { topicId: string; input: UpdateTopicInput }) => topicService.update(topicId, input),
    onSuccess: invalidate,
  });
};
