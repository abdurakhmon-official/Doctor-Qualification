'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSpecialtyInput, UpdateSpecialtyInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { specialtyService } from '@/lib/services';

export const useSpecialties = () => {
  return useQuery({
    queryKey: queryKeys.specialties,
    queryFn: () => specialtyService.list(),
  });
};

export const useAdminSpecialties = () => {
  return useQuery({
    queryKey: queryKeys.adminSpecialties,
    queryFn: () => specialtyService.adminList(),
  });
};

export const useCreateSpecialty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSpecialtyInput) => specialtyService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminSpecialties }),
  });
};

export const useUpdateSpecialty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ specialtyId, input }: { specialtyId: string; input: UpdateSpecialtyInput }) =>
      specialtyService.update(specialtyId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminSpecialties }),
  });
};
