import { isAxiosError } from 'axios';
import type { ApiError } from '@repo/contracts';
import { messageFor } from '@/lib/messages';

// interfaces

export interface ErrorDetail {
  message: string;
  code?: string;
  meta?: Record<string, string | number>;
  fields: Record<string, string>;
  status?: number;
}

export const errorFrom = (error: unknown): ErrorDetail => {
  if (isAxiosError<ApiError>(error)) {
    const body = error.response?.data;

    return {
      message: messageFor(body?._code, body?._message, body?.meta) ?? error.message,
      code: body?._code,
      meta: body?.meta,
      fields: Object.fromEntries(
        (body?.errors ?? []).map((item) => [
          item.field,
          messageFor(item.message, item.message) ?? item.message,
        ]),
      ),
      status: error.response?.status,
    };
  }

  return { message: error instanceof Error ? error.message : String(error), fields: {} };
};
