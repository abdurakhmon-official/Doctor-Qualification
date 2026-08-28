import type { Locale } from '@repo/contracts';

export const pickLocalized = (value: unknown, locale: Locale): string => {
  const record = value as Record<string, string> | null;
  return record?.[locale] ?? record?.uz ?? '';
};
