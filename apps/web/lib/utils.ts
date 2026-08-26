import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

/** `UploadService.upload()` qaytargan `key`dan to'liq ko'rinadigan URL yasaydi. */
export const assetUrl = (key: string | null | undefined): string | undefined => {
  if (!key) return undefined;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  return `${base}/s3/file/${key}`;
};
