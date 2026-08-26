'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateQuestionInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { questionService } from '@/lib/services';

export const useUpdateQuestion = (examId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, input }: { questionId: string; input: UpdateQuestionInput }) => questionService.update(questionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminExam(examId) }),
  });
};

export const useDeleteQuestion = (examId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => questionService.delete(questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminExam(examId) }),
  });
};
