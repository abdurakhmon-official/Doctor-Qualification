'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RatingQuery, UpdateRatingSettingsInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { ratingService } from '@/lib/services';

export const useRatings = (query: Partial<RatingQuery> & { specialtyId: string | undefined }) => {
  return useQuery({
    queryKey: queryKeys.ratings(query),
    queryFn: () => ratingService.list(query as Partial<RatingQuery>),
    enabled: Boolean(query.specialtyId),
  });
};

export const useMyRating = (specialtyId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.myRating(specialtyId ?? ''),
    queryFn: () => ratingService.myRating(specialtyId as string),
    enabled: Boolean(specialtyId),
  });
};

export const useRatingSettings = () => {
  return useQuery({
    queryKey: queryKeys.ratingSettings,
    queryFn: () => ratingService.getSettings(),
  });
};

export const useUpdateRatingSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRatingSettingsInput) => ratingService.updateSettings(input),
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.ratingSettings, settings),
  });
};
