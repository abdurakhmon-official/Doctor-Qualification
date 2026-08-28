'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminCertificateQuery, UpdateCertificateTemplateInput } from '@repo/contracts';
import { queryKeys } from '@/lib/query-keys';
import { certificateService } from '@/lib/services';

export const useMyCertificates = () => {
  return useQuery({
    queryKey: queryKeys.myCertificatesBase,
    queryFn: () => certificateService.myCertificates(),
  });
};

export const useCertificate = (certificateId: string) => {
  return useQuery({
    queryKey: queryKeys.certificate(certificateId),
    queryFn: () => certificateService.verify(certificateId),
  });
};

export const useAdminCertificates = (query: Partial<AdminCertificateQuery>) => {
  return useQuery({
    queryKey: queryKeys.adminCertificates(query),
    queryFn: () => certificateService.adminList(query),
  });
};

export const useRevokeCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificateId: string) => certificateService.revoke(certificateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminCertificatesBase }),
  });
};

export const useCertificateTemplate = () => {
  return useQuery({
    queryKey: queryKeys.certificateTemplate,
    queryFn: () => certificateService.getTemplate(),
  });
};

export const useUpdateCertificateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCertificateTemplateInput) => certificateService.updateTemplate(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.certificateTemplate }),
  });
};
