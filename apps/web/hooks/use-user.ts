'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUserQuery, SetActiveInput, UpdateRoleInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { userService } from '@/lib/services';

export const useAdminUsers = (query: Partial<AdminUserQuery>) => {
  return useQuery({
    queryKey: queryKeys.adminUsers(query),
    queryFn: () => userService.list(query),
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateRoleInput }) => userService.updateRole(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsersBase }),
  });
};

export const useSetUserActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: SetActiveInput }) => userService.setActive(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsersBase }),
  });
};
