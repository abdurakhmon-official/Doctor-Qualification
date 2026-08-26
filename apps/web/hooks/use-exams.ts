'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminExamQuery, CreateExamInput, CreateQuestionInput, UpdateExamInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { examService } from '@/lib/services';

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
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: string) => examService.delete(examId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminExamsBase }),
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, input }: { examId: string; input: CreateQuestionInput }) => examService.createQuestion(examId, input),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: queryKeys.adminExam(variables.examId) }),
  });
};
