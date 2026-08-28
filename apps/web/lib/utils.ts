import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { QualificationLevel } from '@repo/contracts';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const LEVEL_BADGE_VARIANT: Record<QualificationLevel, 'default' | 'success' | 'warning'> = {
  BEGINNER: 'default',
  INTERMEDIATE: 'warning',
  GOOD: 'default',
  HIGH: 'success',
  EXPERT: 'success',
};

export const assetUrl = (key: string | null | undefined): string | undefined => {
  if (!key) return undefined;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  return `${base}/s3/file/${key}`;
};
