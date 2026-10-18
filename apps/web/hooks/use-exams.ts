'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminExamQuery, CreateExamInput, CreateQuestionInput, ImportQuestionsInput, UpdateExamInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { examService } from '@/lib/services';
import { useInvalidateQuestionViews } from '@/hooks/use-questions';

export const useAdminExams = (query: Partial<AdminExamQuery>) => {
  return useQuery({
    queryKey: queryKeys.adminExams(query),
    queryFn: () => examService.list(query),
  });
};

export const useAdminExam = (examId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.adminExam(examId ?? ''),
    queryFn: () => examService.get(examId as string),
    enabled: Boolean(examId),
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExamInput) => examService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminExamsBase }),
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, input }: { examId: string; input: UpdateExamInput }) => examService.update(examId, input),
    onSuccess: (exam) => {
      queryClient.setQueryData(queryKeys.adminExam(exam.id), exam);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminExamsBase });
      // a specialty change clears question topics on the server
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestionsBase });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminTopicsBase });
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: string) => examService.delete(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminExamsBase });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuestionsBase });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminTopicsBase });
    },
  });
};

export const useCreateQuestion = () => {
  const invalidate = useInvalidateQuestionViews();

  return useMutation({
    mutationFn: ({ examId, input }: { examId: string; input: CreateQuestionInput }) => examService.createQuestion(examId, input),
    onSuccess: (_data, variables) => invalidate(variables.examId),
  });
};

export const useImportQuestions = () => {
  const invalidate = useInvalidateQuestionViews();

  return useMutation({
    mutationFn: ({ examId, input }: { examId: string; input: ImportQuestionsInput }) => examService.importQuestions(examId, input),
    onSuccess: (_data, variables) => invalidate(variables.examId),
  });
};
