'use client';

import { useMutation } from '@tanstack/react-query';
import { uploadService } from '@/lib/services';

export const useUpload = () => {
  return useMutation({
    mutationFn: ({ folder, file }: { folder: string; file: File }) => uploadService.upload(folder, file),
  });
};
