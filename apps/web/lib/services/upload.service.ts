import type { ApiResponse } from '@repo/contracts';
import api from '@/lib/axios';

interface UploadPolicy {
  method: 'PUT';
  uploadUrl: string;
  headers: Record<string, string>;
  key: string;
  url: string;
  expiresIn: number;
  maxBytes: number;
}

export class UploadService {
  async generatePolicy(folder: string, file: File): Promise<UploadPolicy> {
    const { data } = await api.get<ApiResponse<UploadPolicy>>('/s3/generate-policy', {
      params: { folder, contentType: file.type, filename: file.name, size: file.size },
    });

    return data.data;
  }

  /** S3'ga to'g'ridan-to'g'ri yuklaydi — ilova `api` instansi ORQALI EMAS (Authorization header presigned URL imzosiga kirmaydi). */
  async upload(folder: string, file: File): Promise<{ key: string; fileName: string }> {
    const policy = await this.generatePolicy(folder, file);

    await fetch(policy.uploadUrl, { method: 'PUT', headers: policy.headers, body: file });

    return { key: policy.key, fileName: file.name };
  }
}

export const uploadService = new UploadService();
