'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminQuestionQuery, UpdateQuestionInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { questionService } from '@/lib/services';

export const useAdminQuestions = (query: Partial<AdminQuestionQuery>) => {
  return useQuery({
    queryKey: queryKeys.adminQuestions(query),
    queryFn: () => questionService.list(query),
  });
};

/** Question edits change exam detail, the question bank and per-topic question counts. */
export const useInvalidateQuestionViews = () => {
  const queryClient = useQueryClient();

  return (examId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminExam(examId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestionsBase });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminTopicsBase });
  };
};

export const useUpdateQuestion = (examId: string) => {
  const invalidate = useInvalidateQuestionViews();

  return useMutation({
    mutationFn: ({ questionId, input }: { questionId: string; input: UpdateQuestionInput }) => questionService.update(questionId, input),
    onSuccess: () => invalidate(examId),
  });
};

export const useDeleteQuestion = (examId: string) => {
  const invalidate = useInvalidateQuestionViews();

  return useMutation({
    mutationFn: (questionId: string) => questionService.delete(questionId),
    onSuccess: () => invalidate(examId),
  });
};
