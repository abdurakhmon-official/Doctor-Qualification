'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUserQuery, SetActiveInput, UpdateProfileInput, UpdateRoleInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { userService } from '@/lib/services';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/auth.slice';

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

export const useUpdateProfile = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => userService.updateProfile(input),
    onSuccess: (user) => {
      dispatch(updateUser(user));
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
};
